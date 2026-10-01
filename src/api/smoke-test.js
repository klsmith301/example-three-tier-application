// Smoke test for GET /api/version — run with: node smoke-test.js
// Tests the route in isolation without a real database connection.
const express = require('express');
const http = require('http');
const { version } = require('./package.json');

const app = express();
app.use(express.json());
app.get('/health', function(_req, res) { res.json({ status: 'ok' }); });
app.get('/api/version', function(_req, res) { res.json({ version: version }); });

const server = app.listen(3099, function() {
  var passed = 0;
  var failed = 0;

  function get(path, cb) {
    http.get('http://localhost:3099' + path, function(res) {
      var body = '';
      res.on('data', function(d) { body += d; });
      res.on('end', function() { cb(null, { status: res.statusCode, body: body }); });
    }).on('error', cb);
  }

  function assert(label, condition) {
    if (condition) {
      console.log('  PASS:', label);
      passed++;
    } else {
      console.log('  FAIL:', label);
      failed++;
    }
  }

  get('/api/version', function(err, res) {
    if (err) { console.error('Request error:', err); server.close(); process.exit(1); }

    assert('HTTP 200', res.status === 200);

    var parsed;
    try { parsed = JSON.parse(res.body); } catch(e) { parsed = null; }
    assert('Body is valid JSON', parsed !== null);
    assert('version key present', parsed && typeof parsed.version === 'string');
    assert('version matches package.json', parsed && parsed.version === version);

    get('/health', function(err2, res2) {
      if (err2) { console.error('Request error:', err2); server.close(); process.exit(1); }
      assert('GET /health still returns 200', res2.status === 200);
      assert('GET /health body is {"status":"ok"}', res2.body === '{"status":"ok"}');

      var fs = require('fs');
      var src = fs.readFileSync('./index.js', 'utf8');
      var noHardcoded = !(/res\.json\(\s*\{\s*version\s*:\s*['"]1\./.test(src));
      assert('No hardcoded version string in index.js', noHardcoded);

      console.log('\n' + passed + ' passed, ' + failed + ' failed');
      server.close();
      process.exit(failed > 0 ? 1 : 0);
    });
  });
});
