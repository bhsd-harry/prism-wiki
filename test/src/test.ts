import {mochaTest} from '@bhsd/test-util';
import {parse} from './parser.js';
import tests from '../parserTests.json' with {type: 'json'};

mochaTest(tests, parse);
