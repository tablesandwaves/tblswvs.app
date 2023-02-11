# tblswvs.app

An experimental controller for electronic music.

## About

This project is an [Electron](https://www.electronjs.org/) app to provide a bridge between a [monome grid](https://monome.org/docs/grid/) and Ableton Live.

### Dependencies

* [AbletonOSC](https://github.com/ideoforms/AbletonOSC): install into your Ableton Live Remote Scripts directory. Used for communication with Ableton.
* [serialosc](https://monome.org/docs/serialosc/setup/): used for communication with a monome grid.

### Installing

Clone the repository and install the NPM dependencies:

```
$ git clone git@github.com:tablesandwaves/tblswvs.app.git
$ npm install
```

### Running

First, configure your grid serial number in `config/grid.yml`.

Then run the start command:

```
$ npm run start
```

This will transpile the Typescript code and copy all relevant files into a `./dist` directory and then launch the Electron UI. The app will run until it is quit or a signal interruption (e.g., ^C SIGINT) message is received.

## Grid Interface

The bottom row (number 8, index 7) is a global row.

* Buttons 1-6: select tracks:
  1. Kick
  2. Snare
  3. HiHat
  4. Perc
  5. Opsix
  6. Hydra
* Button 7: set grid rows 1-7 to the rhythm page for the current track
* Button 8: not yet implemented
* Button 9: set grid rows 1-7 to the melody page for the current track
