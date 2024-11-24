const path = require("path");
const fs   = require("fs");

module.exports = {
  packagerConfig: {
    asar: true,
    icon: "./images/tblswvs",
    extraResource: [
      "./dist/config/grid.yml",
      "./dist/config/grid_page_drumpad.yml",
      "./dist/config/grid_page_global_0.yml",
      "./dist/config/grid_page_global_1.yml",
      "./dist/config/grid_page_input_notes_0.0.yml",
      "./dist/config/grid_page_input_notes_0.1.yml",
      "./dist/config/grid_page_input_notes_0.2.yml",
      "./dist/config/grid_page_input_notes_0.3.yml",
      "./dist/config/grid_page_input_notes_1.yml",
      "./dist/config/grid_page_main_nav.yml",
      "./dist/config/grid_page_ramps_0.yml",
      "./dist/config/grid_page_rhythm_0.yml",
      "./dist/config/grid_page_rhythm_1.yml",
      "./dist/config/grid_page_rhythm_2.yml",
      "./dist/config/grid_page_rhythm_3.yml",
      "./dist/config/patterns_beats.yml",
      "./dist/config/tracks.yml",
      "./dist/config/tracks_2024.3.yml",
      "./dist/config/tracks_2024.4.yml",
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
