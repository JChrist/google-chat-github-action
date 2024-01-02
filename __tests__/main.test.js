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
    expect(debugMock).toHaveBeenCalledWith('input params: name=name, status=status, url=url, collapse=-1');
  });

  it('sets a failed status', async () => {
    // Set the action's inputs as return values from core.getInput()
    getInputMock.mockImplementation(name => '');

    await main.run();
    expect(runMock).toHaveReturned();

    // Verify that all of the core library functions were called correctly
    expect(setFailedMock).toHaveBeenCalled();
  });

  describe('inputs', () => {
    it('fails if required input is not provided', async () => {
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

    it('reads and converts custom collapse', async () => {
      // Set the action's inputs as return values from core.getInput()
      getInputMock.mockImplementation(input => {
        if (['name', 'url', 'status'].includes(input)) {
          return input;
        }
        if (input === 'collapse') {
          return '5';
        }
        return '';
      });

      await main.run();
      expect(runMock).toHaveReturned();

      // Verify that all of the core library functions were called correctly
      expect(debugMock).toHaveBeenCalledWith('input params: name=name, status=status, url=url, collapse=5');
    });

    it('reads and converts invalid collapse', async () => {
      // Set the action's inputs as return values from core.getInput()
      getInputMock.mockImplementation(input => {
        if (['name', 'url', 'status'].includes(input)) {
          return input;
        }
        if (input === 'collapse') {
          return 'asd';
        }
        return '';
      });

      await main.run();
      expect(runMock).toHaveReturned();

      // Verify that all of the core library functions were called correctly
      expect(debugMock).toHaveBeenCalledWith('input params: name=name, status=status, url=url, collapse=-1');
    });
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

    const card = getCardFromBody(req.body);

    const statusWidget = getStatusWidget(card);
    expect(statusWidget.label).toContain('Status');
    expect(statusWidget.text).toContain(main.colors.other);
    expect(statusWidget.text).toContain('Status');
    expect(statusWidget.iconUrl).toContain('status_cancelled.png');
    expect(statusWidget.buttonText).toContain('Open Checks');
    expect(statusWidget.buttonUrl).toContain(`https://github.com/${owner}/${repo}/pull/${issueNumber}/checks`);

    const repoWidget = getRepoWidget(card);
    expect(repoWidget.label).toContain('Repository');
    expect(repoWidget.text).toContain(`${owner}/${repo}`);
    expect(repoWidget.iconUrl).toContain('repo.png');
    expect(repoWidget.buttonText).toContain('Open Repository');
    expect(repoWidget.buttonUrl).toContain(`https://github.com/${owner}/${repo}`);

    const eventWidget = getEventWidget(card);
    expect(eventWidget.label).toContain('Event');
    expect(eventWidget.text).toContain('Pull Request');
    expect(eventWidget.iconUrl).toContain('event_pull_request.png');
    expect(eventWidget.buttonText).toContain('Open Event');
    expect(eventWidget.buttonUrl).toContain(`https://github.com/${owner}/${repo}/pull/${issueNumber}`);

    const refWidget = getRefWidget(card);
    expect(refWidget.label).toContain('Ref');
    expect(refWidget.text).toContain(ref);
    expect(refWidget.iconUrl).toContain('ref.png');
    expect(refWidget.buttonText).toBeFalsy();

    const worfkflowWidget = getWorkflowWidget(card);
    expect(worfkflowWidget.label).toContain('Workflow');
    expect(worfkflowWidget.text).toContain(workflow);
    expect(worfkflowWidget.iconUrl).toContain('event_workflow_dispatch.png');
    expect(worfkflowWidget.buttonText).toBeFalsy();

    const actorWidget = getActorWidget(card);
    expect(actorWidget.label).toContain('Actor');
    expect(actorWidget.text).toContain(actor);
    expect(actorWidget.iconUrl).toContain('actor.png');
    expect(actorWidget.buttonText).toBeFalsy();
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

    const statusText = getStatusWidget(getCardFromBody(capture[0].body)).text;
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
    const statusText = getStatusWidget(getCardFromBody(capture[0].body)).text;
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
    const statusText = getStatusWidget(getCardFromBody(capture[0].body)).text;
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

    const card = getCardFromBody(capture[0].body);

    const statusWidget = getStatusWidget(card);
    expect(statusWidget.buttonText).toContain('Open Checks');
    expect(statusWidget.buttonUrl).toContain(`https://github.com/${owner}/${repo}/commit/${sha}/checks`);

    const repoWidget = getRepoWidget(card);
    expect(repoWidget.buttonText).toContain('Open Repository');
    expect(repoWidget.buttonUrl).toContain(`https://github.com/${owner}/${repo}`);

    const eventWidget = getEventWidget(card);
    expect(eventWidget.label).toContain('Event');
    expect(eventWidget.text).toContain('Push');
    expect(eventWidget.iconUrl).toContain('event_push.png');
    expect(eventWidget.buttonText).toContain('Open Event');
    expect(eventWidget.buttonUrl).toContain(`https://github.com/${owner}/${repo}/commit/${sha}`);
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

    const card = getCardFromBody(capture[0].body);

    const statusWidget = getStatusWidget(card);
    expect(statusWidget.buttonText).toContain('Open Checks');
    expect(statusWidget.buttonUrl).toContain(`https://github.com/${owner}/${repo}/commit/${sha}/checks`);

    const repoWidget = getRepoWidget(card);
    expect(repoWidget.buttonText).toContain('Open Repository');
    expect(repoWidget.buttonUrl).toContain(`https://github.com/${owner}/${repo}`);

    const eventWidget = getEventWidget(card);
    expect(eventWidget.label).toContain('Event');
    expect(eventWidget.text).toContain('Workflow Dispatch');
    expect(eventWidget.iconUrl).toContain('event_workflow_dispatch.png');
    expect(eventWidget.buttonText).toContain('Open Event');
    expect(eventWidget.buttonUrl).toContain(`https://github.com/${owner}/${repo}/commit/${sha}`);
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

    const card = getCardFromBody(capture[0].body);

    const statusWidget = getStatusWidget(card);
    expect(statusWidget.buttonText).toContain('Open Checks');
    expect(statusWidget.buttonUrl).toContain(`https://github.com/${owner}/${repo}/commit/${sha}/checks`);

    const repoWidget = getRepoWidget(card);
    expect(repoWidget.buttonText).toContain('Open Repository');
    expect(repoWidget.buttonUrl).toContain(`https://github.com/${owner}/${repo}`);

    const eventWidget = getEventWidget(card);
    expect(eventWidget.label).toContain('Event');
    expect(eventWidget.text).toContain('Push');
    expect(eventWidget.iconUrl).toContain('event_push.png');
    expect(eventWidget.buttonText).toContain('Open Event');
    expect(eventWidget.buttonUrl).toContain(`https://github.com/${owner}/${repo}/commit/${sha}`);
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

  function getCardFromBody(body) {
    return body.cardsV2[0].card;
  }

  function getCardWidget(card, num) {
    const dt = card.sections[0].widgets[num].decoratedText;
    return { label: dt.topLabel, text: dt.text, iconUrl: dt.icon?.iconUrl, buttonText: dt.button?.text, buttonUrl: dt.button?.onClick?.openLink?.url };
  }

  function getStatusWidget(card) {
    return getCardWidget(card, 0);
  }

  function getRepoWidget(card) {
    return getCardWidget(card, 1);
  }

  function getEventWidget(card) {
    return getCardWidget(card, 2);
  }

  function getRefWidget(card) {
    return getCardWidget(card, 3);
  }

  function getWorkflowWidget(card) {
    return getCardWidget(card, 4);
  }

  function getActorWidget(card) {
    return getCardWidget(card, 5);
  }
});
