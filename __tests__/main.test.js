/**
 * Unit tests for the action's main functionality, src/main.js
 */
const core = require('@actions/core');
const axios = require('axios');
const github = require('@actions/github');
const main = require('../src/main');

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

describe('action', () => {
  const mockData = {};

  beforeEach(() => {
    jest.clearAllMocks();
    // mock github actions object
    mockData.owner = 'jchrist';
    mockData.repo = 'google-chat-github-action';
    mockData.eventName = 'pull_request';
    mockData.ref = 'refs/heads/main';
    mockData.sha = '123abc';
    mockData.issueNumber = 'test issue number';
    mockData.workflow = 'test workflow';
    mockData.actor = 'jchrist';
    setupGithubContext();
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
    const { owner, repo, eventName, ref, issueNumber, workflow, actor } = mockData;

    expect(req.url).toBe('url');
    expect(req.body.cardsV2[0].cardId).toBe('name');
    expect(req.body.cardsV2[0].card.name).toBe('name');
    expect(req.body.cardsV2[0].card.header.title).toContain('name');
    expect(req.body.cardsV2[0].card.header.subtitle).toContain(`${owner}/${repo}`);

    const sections = req.body.cardsV2[0].card.sections;

    expect(sections[0].header).toContain('Status');
    expect(sections[0].widgets[0].decoratedText.text).toContain(main.colors.other);
    expect(sections[0].widgets[0].decoratedText.text).toContain('Status');
    expect(sections[0].widgets[0].decoratedText.icon.iconUrl).toContain('status_cancelled.png');
    expect(sections[0].widgets[0].decoratedText.button.text).toContain('Open Checks');
    expect(sections[0].widgets[0].decoratedText.button.onClick.openLink.url).toContain(`https://github.com/${owner}/${repo}/pull/${issueNumber}/checks`);

    expect(sections[1].header).toContain('Repository');
    expect(sections[1].widgets[0].decoratedText.text).toContain(`${owner}/${repo}`);
    expect(sections[1].widgets[0].decoratedText.icon.iconUrl).toContain('repo.png');
    expect(sections[1].widgets[0].decoratedText.button.text).toContain('Open Repository');
    expect(sections[1].widgets[0].decoratedText.button.onClick.openLink.url).toContain(`https://github.com/${owner}/${repo}`);

    expect(sections[2].header).toContain('Event');
    expect(sections[2].widgets[0].decoratedText.text).toContain('Pull Request');
    expect(sections[2].widgets[0].decoratedText.icon.iconUrl).toContain('event_pull_request.png');
    expect(sections[2].widgets[0].decoratedText.button.text).toContain('Open Event');
    expect(sections[2].widgets[0].decoratedText.button.onClick.openLink.url).toContain(`https://github.com/${owner}/${repo}/pull/${issueNumber}`);

    expect(sections[3].header).toContain('Ref');
    expect(sections[3].widgets[0].decoratedText.text).toContain(ref);
    expect(sections[3].widgets[0].decoratedText.icon.iconUrl).toContain('ref.png');
    expect(sections[3].widgets[0].decoratedText.button).toBeFalsy();

    // workflow
    expect(sections[4].header).toContain('Workflow');
    expect(sections[4].widgets[0].decoratedText.text).toContain(workflow);
    expect(sections[4].widgets[0].decoratedText.icon.iconUrl).toContain('event_workflow_dispatch.png');
    expect(sections[4].widgets[0].decoratedText.button).toBeFalsy();

    // actor
    expect(sections[5].header).toContain('Actor');
    expect(sections[5].widgets[0].decoratedText.text).toContain(actor);
    expect(sections[5].widgets[0].decoratedText.icon.iconUrl).toContain('actor.png');
    expect(sections[5].widgets[0].decoratedText.button).toBeFalsy();
  });

  it('handles and reports axios failure', async () => {
    getInputMock.mockImplementation(input => input);
    axiosMock.mockImplementation(() => {
      throw new Error('test axios error');
    });
    await main.run();
    expect(runMock).toHaveReturned();

    expect(axiosMock).toHaveBeenCalled();
    expect(setFailedMock).toHaveBeenCalled();
  });

  it('sends notification for success status', async () => {
    getInputMock.mockImplementation(input => (input === 'status' ? 'Success' : input));
    const capture = [];
    axiosMock.mockImplementation((url, body) => {
      capture.push({ url, body });
      return { status: 200, data: 'ok' };
    });
    await main.run();
    expect(runMock).toHaveReturned();

    expect(axiosMock).toHaveBeenCalled();
    expect(capture).toHaveLength(1);

    const statusText = capture[0].body.cardsV2[0].card.sections[0].widgets[0].decoratedText.text;
    expect(statusText).toContain(main.colors.success);
    expect(JSON.stringify(capture[0].body)).not.toContain(main.colors.failure);
    expect(JSON.stringify(capture[0].body)).not.toContain(main.colors.other);
  });

  it('sends notification for failure status', async () => {
    getInputMock.mockImplementation(input => (input === 'status' ? 'Failure' : input));
    const capture = [];
    axiosMock.mockImplementation((url, body) => {
      capture.push({ url, body });
      return { status: 200, data: 'ok' };
    });
    await main.run();
    expect(runMock).toHaveReturned();

    expect(axiosMock).toHaveBeenCalled();
    expect(capture).toHaveLength(1);
    const statusText = capture[0].body.cardsV2[0].card.sections[0].widgets[0].decoratedText.text;
    expect(statusText).toContain(main.colors.failure);
    expect(JSON.stringify(capture[0].body)).not.toContain(main.colors.success);
    expect(JSON.stringify(capture[0].body)).not.toContain(main.colors.other);
  });

  it('sends notification for cancelled status', async () => {
    getInputMock.mockImplementation(input => (input === 'status' ? 'cancelled' : input));
    const capture = [];
    axiosMock.mockImplementation((url, body) => {
      capture.push({ url, body });
      return { status: 200, data: 'ok' };
    });
    await main.run();
    expect(runMock).toHaveReturned();

    expect(axiosMock).toHaveBeenCalled();
    expect(capture).toHaveLength(1);
    const statusText = capture[0].body.cardsV2[0].card.sections[0].widgets[0].decoratedText.text;
    expect(statusText).toContain(main.colors.other);
    expect(JSON.stringify(capture[0].body)).not.toContain(main.colors.success);
    expect(JSON.stringify(capture[0].body)).not.toContain(main.colors.failure);
  });

  it('sends notification for push', async () => {
    getInputMock.mockImplementation(input => (input === 'status' ? 'success' : input));
    mockData.eventName = 'push';
    setupGithubContext();

    const capture = [];
    axiosMock.mockImplementation((url, body) => {
      capture.push({ url, body });
      return { status: 200, data: 'ok' };
    });
    await main.run();
    expect(runMock).toHaveReturned();

    expect(axiosMock).toHaveBeenCalled();
    expect(capture).toHaveLength(1);

    const { owner, repo, sha } = mockData;

    const sections = capture[0].body.cardsV2[0].card.sections;

    expect(sections[0].widgets[0].decoratedText.button.text).toContain('Open Checks');
    expect(sections[0].widgets[0].decoratedText.button.onClick.openLink.url).toContain(`https://github.com/${owner}/${repo}/commit/${sha}/checks`);

    expect(sections[1].widgets[0].decoratedText.button.text).toContain('Open Repository');
    expect(sections[1].widgets[0].decoratedText.button.onClick.openLink.url).toContain(`https://github.com/${owner}/${repo}`);

    expect(sections[2].header).toContain('Event');
    expect(sections[2].widgets[0].decoratedText.text).toContain('Push');
    expect(sections[2].widgets[0].decoratedText.icon.iconUrl).toContain('event_push.png');
    expect(sections[2].widgets[0].decoratedText.button.text).toContain('Open Event');
    expect(sections[2].widgets[0].decoratedText.button.onClick.openLink.url).toContain(`https://github.com/${owner}/${repo}/commit/${sha}`);
  });

  it('sends notification for workflow dispatch', async () => {
    getInputMock.mockImplementation(input => (input === 'status' ? 'success' : input));
    mockData.eventName = 'workflow_dispatch';
    setupGithubContext();

    const capture = [];
    axiosMock.mockImplementation((url, body) => {
      capture.push({ url, body });
      return { status: 200, data: 'ok' };
    });
    await main.run();
    expect(runMock).toHaveReturned();

    expect(axiosMock).toHaveBeenCalled();
    expect(capture).toHaveLength(1);

    const { owner, repo, sha } = mockData;

    const sections = capture[0].body.cardsV2[0].card.sections;

    expect(sections[0].widgets[0].decoratedText.button.text).toContain('Open Checks');
    expect(sections[0].widgets[0].decoratedText.button.onClick.openLink.url).toContain(`https://github.com/${owner}/${repo}/commit/${sha}/checks`);

    expect(sections[1].widgets[0].decoratedText.button.text).toContain('Open Repository');
    expect(sections[1].widgets[0].decoratedText.button.onClick.openLink.url).toContain(`https://github.com/${owner}/${repo}`);

    expect(sections[2].header).toContain('Event');
    expect(sections[2].widgets[0].decoratedText.text).toContain('Workflow Dispatch');
    expect(sections[2].widgets[0].decoratedText.icon.iconUrl).toContain('event_workflow_dispatch.png');
    expect(sections[2].widgets[0].decoratedText.button.text).toContain('Open Event');
    expect(sections[2].widgets[0].decoratedText.button.onClick.openLink.url).toContain(`https://github.com/${owner}/${repo}/commit/${sha}`);
  });

  it('sends notification for unknown event as push', async () => {
    getInputMock.mockImplementation(input => (input === 'status' ? 'success' : input));
    mockData.eventName = null;
    setupGithubContext();

    const capture = [];
    axiosMock.mockImplementation((url, body) => {
      capture.push({ url, body });
      return { status: 200, data: 'ok' };
    });
    await main.run();
    expect(runMock).toHaveReturned();

    expect(axiosMock).toHaveBeenCalled();
    expect(capture).toHaveLength(1);

    const { owner, repo, sha } = mockData;

    const sections = capture[0].body.cardsV2[0].card.sections;

    expect(sections[0].widgets[0].decoratedText.button.text).toContain('Open Checks');
    expect(sections[0].widgets[0].decoratedText.button.onClick.openLink.url).toContain(`https://github.com/${owner}/${repo}/commit/${sha}/checks`);

    expect(sections[1].widgets[0].decoratedText.button.text).toContain('Open Repository');
    expect(sections[1].widgets[0].decoratedText.button.onClick.openLink.url).toContain(`https://github.com/${owner}/${repo}`);

    expect(sections[2].header).toContain('Event');
    expect(sections[2].widgets[0].decoratedText.text).toContain('Push');
    expect(sections[2].widgets[0].decoratedText.icon.iconUrl).toContain('event_push.png');
    expect(sections[2].widgets[0].decoratedText.button.text).toContain('Open Event');
    expect(sections[2].widgets[0].decoratedText.button.onClick.openLink.url).toContain(`https://github.com/${owner}/${repo}/commit/${sha}`);
  });

  function setupGithubContext() {
    Object.defineProperty(github, 'context', {
      value: {
        repo: { owner: mockData.owner, repo: mockData.repo },
        eventName: mockData.eventName,
        ref: mockData.ref,
        sha: mockData.sha,
        issue: { number: mockData.issueNumber },
        workflow: mockData.workflow,
        actor: mockData.actor
      }
    });
  }
});
