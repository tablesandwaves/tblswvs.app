const path = require("path");
const fs   = require("fs");

module.exports = {
  packagerConfig: {
    asar: true,
    icon: "./images/tblswvs",
    extraResource: [
      "./dist/config/grid_page_chord_0.yml",
      "./dist/config/grid_page_drumpad.yml",
      "./dist/config/grid_page_global_0.yml",
      "./dist/config/grid_page_main_nav.yml",
      "./dist/config/grid_page_melody_0.yml",
      "./dist/config/grid_page_melody_1.yml",
      "./dist/config/grid_page_melody_2.yml",
      "./dist/config/grid_page_ramps_0.yml",
      "./dist/config/grid_page_rhythm_0.yml",
      "./dist/config/grid_page_rhythm_1.yml",
      "./dist/config/grid_page_rhythm_2.yml",
      "./dist/config/grid.yml",
      "./dist/config/patterns_beats.yml",
      "./dist/config/tracks.yml",
    ],
    ignore: [
      "^.gitignore",
      "^/app",
      "^/config",
      "^forge.config.js",
      "^main.ts",
      "^/m4l",
      "^package-lock.json",
      "^preload.ts",
      "^README.md",
      "^/sketches",
      "^/tests",
      "^/tmp",
      "^tsconfig.json",
    ]
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
  ],

};
