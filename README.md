# Homebridge Plugin for LG 2012 Series TVs

Homebridge Plugin based off (https://npmjs.org/package/homebridge-lgtv2) to allow Siri to control LGTV 2012 series.

Hacked together to work with the native IOS 10 Home App, the plugin emulates a light bulb, and maps the brightness control to volume.

## Features
* Power on/off (Works with IOS Home App)

* Change volume (Works with IOS Home App)
The Brightness (Volume) is controlled by percentage, according to the max_volume parameter. My TV can go to 50, but this seems way to loud: so the default is 20.
A min_volume parameter mutes the tv when the volume is lowered. to try and prevent homekit setting power to 0, as its current behaviour


## Very Experimental
* Channel + Volume Control
This is possible using the hue control in the [Elgato Eve](https://www.elgato.com/en/eve/eve-app) app.

Setting "false_run" to true in the config can trys prevent the channel changes whilst experimenting with this 


## Install
```npm install -g homebridge-lgtv-2012```

## Configuration example
```json
{
  "accessories": [
    {
      "accessory": "lgtv-2012",
      "name": "TV",
      "ip": "10.0.1.4",
      "pairingKey": "123456", 
      "min_volume": 2, "max_volume": 20,
      "on_command": "MUTE"
    }
  ]
}
```

### Configuration fields

- `accessory` [required]
Must always be lgtv-2012
- `name` [required]
Name of your accessory
- `ip` [required]
IP address of your tv
- `pairingKey` [required]
The pairing key of the TV

- `max_volume` [optional]
Upper Volume Limit (default: 20)
- `min_volume` [optional]
Lower Volume Limit before muting the TV (default: 2)
- `on_command` [optional]
Wake-on-Lan is not supported, so command to send when siri is asked to "Turn TV on" (default: "MUTE")
