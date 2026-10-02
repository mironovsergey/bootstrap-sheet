import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';
import { assertBuilt, PACKAGE_ROOT } from './consumer';

const PAGE = `<!doctype html>
<body>
  <button type="button" data-bs-toggle="sheet" data-bs-target="#sheet">Open</button>
  <div class="sheet" id="sheet">
    <button type="button" data-bs-dismiss="sheet">Close</button>
  </div>
</body>`;

describe.each(['bootstrap-sheet.js', 'bootstrap-sheet.min.js'])(
  'Package - UMD bundle %s',
  (file) => {
    let window;

    beforeAll(() => {
      assertBuilt();

      // A page of its own per bundle, so the two never share a global
      ({ window } = new JSDOM(PAGE, { runScripts: 'dangerously', pretendToBeVisual: true }));

      const script = window.document.createElement('script');

      script.textContent = fs.readFileSync(path.join(PACKAGE_ROOT, 'dist/js', file), 'utf8');
      window.document.body.append(script);
    });

    afterAll(() => {
      window.close();
    });

    test('should define window.BootstrapSheet when loaded by a script tag', () => {
      expect(typeof window.BootstrapSheet).toBe('function');
      expect(window.BootstrapSheet.NAME).toBe('sheet');
    });

    test('should open a sheet from a data-bs-toggle trigger', () => {
      window.document.querySelector('[data-bs-toggle="sheet"]').click();

      expect(window.BootstrapSheet.getInstance('#sheet')?.isShown).toBe(true);
    });
  },
);
