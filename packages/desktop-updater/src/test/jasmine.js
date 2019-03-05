/*
 * Wire
 * Copyright (C) 2018 Wire Swiss GmbH
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

const Jasmine = require('jasmine');
const JasmineConsoleReporter = require('jasmine-console-reporter');

const reporter = new JasmineConsoleReporter({
  activity: 'dots', // boolean or string ("dots"|"star"|"flip"|"bouncingBar"|...)
  beep: true,
  cleanStack: 1, // (0|false)|(1|true)|2|3
  colors: 2, // (0|false)|(1|true)|2
  emoji: true,
  listStyle: 'indent', // "flat"|"indent"
  verbosity: 3, // (0|false)|1|2|(3|true)|4
});
const jasmine = new Jasmine();

jasmine.loadConfigFile('src/test/jasmine.json');
jasmine.addReporter(reporter);
jasmine.execute();
