/* eslint-disable @typescript-eslint/no-require-imports */
import {mochaTest} from '@bhsd/test-util';
import {parse} from './parser';

mochaTest(require('../../parserTests.json'), parse);
