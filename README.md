# tblswvs.app

An experimental controller for electronic music.

## About

This project is an [Electron](https://www.electronjs.org/) app to provide a bridge between a [monome grid](https://monome.org/docs/grid/) and Ableton Live.

**Status: Alpha.** Code is under active development and may exhibit breaking changes from one commit to the next. Features are actively being added, which may change the software functionality and cause yet undetected bugs.

This project is being shared as a reference example, but is an idiosyncratic, personal project.

### Installing

Clone the repository and install the NPM dependencies:

```
$ git clone git@github.com:tablesandwaves/tblswvs.app.git
$ npm install
```

### Dependencies

#### Max for Live: tblswvs.osc.amxd

Install the Max for Live devices in this repository's [m4l](m4l/) directory.

This Max for Live device communicates with the tblswvs.app Electron app by passing OSC-like messages back and forth. It is a very simple device that uses Max's `[udpreceive]` and `[udpsend]` objects (using ports 33333 and 33334, respectively). For example, when tblswvs.app creates a melody or rhythm, this device is responsible for adding or updating clips and their MIDI notes.

Two Max for Live devices, `tblswvs.osc.amxd` and `tblswvs.rampseq` along with their supporting abstractions, gen~ and JavaScript files must be accessible to Live.

Copy the files in `m4l/` to your Live presets folder

```
$ mkdir -p ~/Music/Ableton/User\ Library/Presets/MIDI\ Effects/Max\ MIDI\ Effect/Tables\ and\ Waves\ OSC
$ cp m4l/midi-effect/* ~/Music/Ableton/User\ Library/Presets/MIDI\ Effects/Max\ MIDI\ Effect/Tables\ and\ Waves\ OSC
$ mkdir -p ~/Music/Ableton/User\ Library/Presets/MIDI\ Effects/Max\ Audio\ Effect/Tables\ and\ Waves\ OSC
$ cp m4l/audio-effect/* ~/Music/Ableton/User\ Library/Presets/MIDI\ Effects/Max\ Audio\ Effect/Tables\ and\ Waves\ OSC
```

Create a new Live Set containing 7 MIDI tracks. Tracks 1-6 will be used for the voice tracks. Track 7 should simply have the Max for Live MIDI device `tblswvs.osc.amxd` added.

#### serialosc

Used for communication with a monome grid.

See: [serialosc](https://monome.org/docs/serialosc/setup/)

### Running

First, configure your grid serial number in `config/grid.yml`.

Then run the start command:

```
$ npm run start
```

This will transpile the Typescript code and copy all relevant files into a `./dist` directory and then launch the Electron UI. The app will run until it is quit or a signal interruption (e.g., ^C SIGINT) message is received. It is recommended that you quit from the Electron app so that it clears the grid state as a cleanup step.

## Grid Interface

The Electron app has an embedded 'Docs' tab that lays out the grid interface pages and button mappings.

## Inspiration

This project is inspired by [William Fields'](https://williamfields.com/) work on his FieldsOS project.
