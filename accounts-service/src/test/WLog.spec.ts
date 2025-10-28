import test from 'node:test'
import assert from 'node:assert'
import { WLog } from '../WLog.js'
import { Logger } from 'winston'


// Testing functionality for WLog.ts

test("Get Logger instance", () => {
  const logger = WLog.getLogger();
  assert.ok(logger instanceof Logger, "Expected logger to be instance of Logger");
});

test("Logger singleton returns same instance", () => {
  const logger1 = WLog.getLogger();
  const logger2 = WLog.getLogger();
  assert.strictEqual(logger1, logger2, "Expected same Logger instance each call");
});