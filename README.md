# tblswvs.app

An experimental controller for electronic music.

## About

This project is an [Electron](https://www.electronjs.org/) app to provide a bridge between a [monome grid](https://monome.org/docs/grid/) and Ableton Live.

**Status: Alpha.** Code is under active development and may exhibit breaking changes from one commit to the next. Features are actively being added, which may change the software functionality.

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

The `tblswvs.osc.amxd` file and its corresponding JavaScript file, `tblswvs.osc.js`, must be accessible to Live. Example setup:

Copy the files in `m4l/` to your Live presets folder

```
$ mkdir -p ~/Music/Ableton/User\ Library/Presets/MIDI\ Effects/Max\ MIDI\ Effect/Tables\ and\ Waves\ OSC
$ cp m4l/* ~/Music/Ableton/User\ Library/Presets/MIDI\ Effects/Max\ MIDI\ Effect/Tables\ and\ Waves\ OSC
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

### Global Row

The bottom row (number 8, index 7) is a global row.

* Buttons 1-6 (Indices 0-5): Track/Voice Selection
  * Kick
  * Snare
  * HiHat
  * Perc
  * Opsix
  * Hydra
* Button 7 (index 8): Rhythm Pages
* Button 8 (index 7): Chord Page
* Button 9 (index 8): Melody Page
* Buttons 10-12 (indices 9-11): Undefined
* Button 13 (index 12): Global Page
* Button 14 (index 13): Shift Key
* Button 15 (index 14): Page Left
* Button 16 (index 15): Page Right

### Grid Page Settings

Grid pages are bundles of related functionality. Specific key press functionality is defined in [config files](config/).

#### Rhythm

Controls variable length rhythmic sequences between 1 and 16 steps.

#### Chord

Grid buttons are mapped to chords depending on the Scale and Tonic settings from the Melody Page.

#### Melody

* Configure the current Scale and Tonic settings
* Add in put melodies
* Apply melodic algorithms to the active track

#### Global Settings

* Set the super measure length

## Inspiration

This project is inspired by [William Fields'](https://williamfields.com/) work on his FieldsOS project.
