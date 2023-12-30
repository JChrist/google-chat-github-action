/**
 * Unit tests for the action's entrypoint in src/index.js and main functionality
 */

describe('index', () => {
  describe('verify entrypoint', () => {
    it('calls run when imported', async () => {
      // Mock the action's entrypoint
      const mockFn = jest.fn();
      jest.mock('../src/index', () => ({
        run: mockFn
      }));
      const main = require('../src/index');
      main.run();
      expect(mockFn).toHaveBeenCalled();
    });
  });

  describe('action', () => {
    const main = require('../src/index');
    const core = require('@actions/core');
    const github = require('@actions/github');
    const axios = require('axios');
    // Mock the GitHub Actions core library
    const debugMock = jest.spyOn(core, 'debug').mockImplementation();
    const getInputMock = jest.spyOn(core, 'getInput').mockImplementation();
    const setFailedMock = jest.spyOn(core, 'setFailed').mockImplementation();
    // const setOutputMock = jest.spyOn(core, 'setOutput').mockImplementation();

    // mock axios
    const axiosMock = jest.spyOn(axios, 'post').mockImplementation();

    const originalGithubContext = { ...github.context };

    // Mock the action's main function
    const runMock = jest.spyOn(main, 'run');

    // Other utilities
    const timeRegex = /^\d{2}:\d{2}:\d{2}/;

    beforeEach(() => {
      jest.clearAllMocks();
      // mock github actions object
    });

    afterEach(() => {
      Object.defineProperty(github, 'context', { value: originalGithubContext });
    });

    it('reads and debugs inputs', async () => {
      // Set the action's inputs as return values from core.getInput()
      getInputMock.mockImplementation(input => {
        if (['name', 'url', 'status'].includes(input)) {
          return input;
        }
        return '';
      });

      await main.run();
      expect(runMock).toHaveReturned();

      // Verify that all of the core library functions were called correctly
      expect(debugMock).toHaveBeenCalledWith(`input params: name=name, status=status, url=url`);
    });

    it('sets a failed status', async () => {
      // Set the action's inputs as return values from core.getInput()
      getInputMock.mockImplementation(name => '');

      await main.run();
      expect(runMock).toHaveReturned();

      // Verify that all of the core library functions were called correctly
      expect(setFailedMock).toHaveBeenCalled();
    });

    it('fails if input is not provided', async () => {
      // Set the action's inputs as return values from core.getInput()
      getInputMock.mockImplementation(name => {
        switch (name) {
          case 'name':
            throw new Error('invalid name');
          default:
            return '';
        }
      });

      await main.run();
      expect(runMock).toHaveReturned();

      // Verify that all of the core library functions were called correctly
      expect(setFailedMock).toHaveBeenCalled();
    });

    it('performs request for notification', async () => {
      const owner = 'jchrist';
      const repo = 'google-chat-github-action';
      const eventName = 'pull_request';
      const ref = 'refs/heads/main';
      const issueNumber = 'test issue number';
      Object.defineProperty(github, 'context', {
        value: {
          repo: { owner, repo },
          eventName,
          ref,
          issue: { number: issueNumber }
        }
      });

      getInputMock.mockImplementation(input => input);
      const captured = [];
      axiosMock.mockImplementation((url, body) => {
        captured.push({ url, body });
        return { status: 200, data: 'ok' };
      });
      await main.run();
      expect(runMock).toHaveReturned();

      expect(axiosMock).toHaveBeenCalled();

      expect(captured).toHaveLength(1);
      const req = captured[0];

      expect(req.url).toBe('url');
      // {"text":"","cardsV2":[{"cardId":"name","card":{"name":"name","header":{"title":"<b>name</b>","subtitle":"<font color=\"#ffc107\">status</font>"},"sections":[{"widgets":[{"columns":{"columnItems":[{"horizontalSizeStyle":"FILL_AVAILABLE_SPACE","horizontalAlignment":"START","verticalAlignment":"TOP","widgets":[{"textParagraph":{"text":"<b>Status: <font color=\"#ffc107\">status</font></b>"}},{"textParagraph":{"text":"<b>Repository</b>: jchrist/google-chat-github-action"}},{"textParagraph":{"text":"<b>Event</b>: pull_request"}},{"textParagraph":{"text":"<b>Ref</b>: undefined"}}]},{"horizontalSizeStyle":"FILL_AVAILABLE_SPACE","horizontalAlignment":"START","verticalAlignment":"TOP","widgets":[{"buttonList":{"buttons":[{"text":"Open Checks","onClick":{"openLink":{"url":"https://github.com/jchrist/google-chat-github-action/pull/test issue number/checks"}},"disabled":false}]}},{"buttonList":{"buttons":[{"text":"Open Repository","onClick":{"openLink":{"url":"https://github.com/jchrist/google-chat-github-action"}},"disabled":false}]}},{"buttonList":{"buttons":[{"text":"Open Event","onClick":{"openLink":{"url":"https://github.com/jchrist/google-chat-github-action/pull/test issue number"}},"disabled":false}]}}]}]}}]}]}}]}
      expect(req.body.cardsV2[0].cardId).toBe('name');
      expect(req.body.cardsV2[0].card.name).toBe('name');
      expect(req.body.cardsV2[0].card.header.title).toContain('<b>name</b>');
      expect(req.body.cardsV2[0].card.header.subtitle).toContain('status');

      const textWidgets = req.body.cardsV2[0].card.sections[0].widgets[0].columns.columnItems[0].widgets;
      expect(textWidgets[0].textParagraph.text).toContain('status');
      expect(textWidgets[1].textParagraph.text).toContain(`<b>Repository</b>: ${owner}/${repo}`);
      expect(textWidgets[2].textParagraph.text).toContain(`<b>Event</b>: ${eventName}`);
      expect(textWidgets[3].textParagraph.text).toContain(`<b>Ref</b>: ${ref}`);

      const buttonWidgets = req.body.cardsV2[0].card.sections[0].widgets[0].columns.columnItems[1].widgets;
      expect(buttonWidgets[0].buttonList.buttons[0].text).toContain('Open Checks');
      expect(buttonWidgets[0].buttonList.buttons[0].onClick.openLink.url).toContain(`https://github.com/${owner}/${repo}/pull/${issueNumber}/checks`);
      expect(buttonWidgets[1].buttonList.buttons[0].text).toContain('Open Repository');
      expect(buttonWidgets[1].buttonList.buttons[0].onClick.openLink.url).toContain(`https://github.com/${owner}/${repo}`);
      expect(buttonWidgets[2].buttonList.buttons[0].text).toContain('Open Event');
      expect(buttonWidgets[2].buttonList.buttons[0].onClick.openLink.url).toContain(`https://github.com/${owner}/${repo}/pull/${issueNumber}`);
    });
  });
});
