/*
 * Wire
 * Copyright (C) 2019 Wire Swiss GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see http://www.gnu.org/licenses/.
 *
 */

const buildPlugins = () => ['@babel/plugin-proposal-object-rest-spread'];

const buildPresets = ({modules = false, debug = false}) => {
  return [
    '@babel/preset-react',
    [
      '@babel/preset-env',
      {
        debug,
        modules,
        targets: {
          browsers: ['chrome >= 66'],
        },
        useBuiltIns: 'usage',
      },
    ],
  ];
};

module.exports = {
  env: {
    test: {
      plugins: buildPlugins(),
      presets: buildPresets({modules: 'commonjs'}),
    },
  },
  plugins: buildPlugins(),
  presets: buildPresets({modules: false}),
};
