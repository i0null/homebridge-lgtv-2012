'use strict';
var false_run = false;

var Service, Characteristic;
var ping = require('ping');
var inherits = require('util').inherits;
var lgtv = require('./lgtv-2012.js').lgtv;

function lgtv_2012_accessory(log, config, api) {
    this.log = log;
    this.api = api;

    if (config) {
        // import the user configuration
        this.name = config.name;
        this.key = config.pairingKey;
        this.host = config.ip;
        this.port = parseInt(config.port) || 8080;
        this.max_volume = 100 / (parseInt(config.max_volume) || 20);
        this.on_command = String(config.on_command).toUpperCase() || 'MUTE';

        // set up tv object and debug flags
        this.tv = new lgtv({ 'host': this.host, 'port': this.port});
        this.tv.debug = this.verbosity = config.debug == "true" ? true : false
        this.tv.min_volume = config.min_volume || 2

        this.tv.false_run = config.false_run || false
        this.powered = false
    }

    this.accessory = new Service.AccessoryInformation();
    this.accessory.setCharacteristic(Characteristic.Name, 'LG TV 2012')
        .setCharacteristic(Characteristic.Manufacturer, 'LG Electronics Inc.')
        .setCharacteristic(Characteristic.Model, '1.0');

    this.service = new Service.Lightbulb(this.name)
    this.service.getCharacteristic(Characteristic.On)
        .on('get', this.getState.bind(this))
        .on('set', this.setState.bind(this));

    this.service.getCharacteristic(Characteristic.Brightness)
        .on('get', this.getVolume.bind(this))
        .on('set', this.setVolume.bind(this));

    this.service.getCharacteristic(Characteristic.Hue)
        .on('get', this.getChannel.bind(this))
        .on('set', this.setChannel.bind(this));

    this.getServices = function() { return [this.service, this.accessory]; }
}

lgtv_2012_accessory.prototype.connect = function(cb) {
    if (this.host && this.host.length && this.port) {
        this.tv.new_session(this.key, (tv) => {
            this.powered = Boolean(tv);
            cb(tv);
        });
    } else {
        this.log('does not appear to be powered on')
        this.powered = false
        cb(null)
    }
}

lgtv_2012_accessory.prototype.getState = function(cb) {
    ping.sys.probe(this.host, function(alive) {
        cb(null, this.powered = alive);
    }, { timeout: 1, min_reply: 1 })
}

lgtv_2012_accessory.prototype.setState = function(toggle, cb) {
    if(!this.powered || this.tv.locked || !toggle) { 
        this.log('Cannot change power setting at this time')
        cb(null, false)
    } else {
        this.getState((error, alive) => { this.connect((tv) => {
            this.debug('Turning: ' + toggle? 'On':'Off')
            if(toggle && this.on_command.length) tv.send_command(this.on_command, (err) => { cb(null, true); }) 
            else cb(null, false)
        }) })
    }
}

lgtv_2012_accessory.prototype.getVolume = function(cb) {
    this.connect((tv) => {
        tv.get_volume( (volume) => {
            this.log('Volume is: ' + volume.level);
            this.debug('Mute is: ' + volume.mute? 'On':'Off');
            cb(null, Math.round(volume.level * this.max_volume));
        })
    })
}

lgtv_2012_accessory.prototype.setVolume = function(to, cb) {
    this.connect((tv) => {
        tv.set_volume(Math.round(to / this.max_volume), (err) => {
            //this.log('Setting Volume to ' + to + '... ' + err? 'Success':'Failure')
            cb(null, true);
        })
    })
}

lgtv_2012_accessory.prototype.getChannel = function(cb) {
    if (!this.host || !this.host.length) cb(null, false)
    else {
        this.connect((tv) => {
            tv.get_channel( (channel) => {
                var ch = parseFloat(channel);
                this.log('Get Channel: ' + ch);
                cb(null, ch);
            })
        })
    }
}

lgtv_2012_accessory.prototype.setChannel = function(channel, cb) {
    this.connect((tv) => {
        channel = parseInt(channel)
        tv.set_channel(channel, (err) => {
            this.log('Set Channel: ' + channel)
            cb(null, err)
        })
    })
}

lgtv_2012_accessory.prototype.getChannelName = function(cb) {
    this.connect((tv) => {
        tv.get_title( (channel) => {
            this.log('on Channel Name: ' + channel)
            cb(null, channel)
        })
    })
}

lgtv_2012_accessory.prototype.identify = function(cb) {
    if (this.host && this.host.length) {
        if(this.powered) {
            if(this.key && this.key.length) {
                this.connect((tv) => { 
                    tv.send_command('APPS', (success) => { 
                        this.log('Identifying by launching LG App menu')
                        cb(null, success)
                    })
                })
            } else {
                tv.pair_request((success) => { 
                    this.log('Performing request for TV key')
                    cb(null, success);
                })
            }
        } else {
            this.checkInterval((alive) => { 
                if(!alive) this.log('Sorry, device did not respond.')
                cb(null, alive) 
            })
        }
    } else {
        this.debug('No host provided')
        cb(null, false)
    }
}

lgtv_2012_accessory.prototype.checkInterval = function(cb) {
    if (!this.host || !this.host.length) cb(null, false)
    else ping.sys.probe(this.host, function(isAlive) {
        this.debug('Alive?: ' + (isAlive? 'Yes':'No'));
        cb(null, this.powered = isAlive);
    })
    //setTimeout(cb, this.checkInterval.bind(this, cb), 2000)
}

module.exports = function (homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory('homebridge-lgtv-2012', 'lgtv-2012', lgtv_2012_accessory);
}

