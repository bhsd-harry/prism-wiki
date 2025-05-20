/* eslint-disable @typescript-eslint/no-require-imports */
import {mochaTest} from '@bhsd/common/dist/test';
import {parse} from './parser';

mochaTest(require('../../parserTests.json'), parse);
