import colors from 'colors/safe';
import * as logger from '../../src/utils/logger';

describe('logger', () => {
  let consoleMock: jest.SpyInstance;

  beforeEach(() => {
    consoleMock = jest.spyOn(console, 'log').mockImplementation();
    colors.disable();
  });

  afterEach(() => {
    consoleMock.mockRestore();
  });

  it('adds prefix', () => {
    logger.log('testing');
    expect(consoleMock).toHaveBeenCalledTimes(1);
    expect(consoleMock).toHaveBeenCalledWith('[Just]', 'testing');
  });

  it('logs timer', () => {
    const timer = logger.timer();
    timer.start('start testing');
    timer.end('end testing');

    expect(consoleMock).toHaveBeenCalledTimes(2);
    expect(consoleMock).toHaveBeenNthCalledWith(
      1,
      '[Just]',
      'wait',
      '-',
      'start testing'
    );
    expect(consoleMock).toHaveBeenNthCalledWith(
      2,
      '[Just]',
      'event',
      '-',
      'end testing',
      expect.any(String),
      'in',
      'ms'
    );
  });

  it('logs wait', () => {
    logger.wait('testing');
    expect(consoleMock).toHaveBeenCalledTimes(1);
    expect(consoleMock).toHaveBeenCalledWith('[Just]', 'wait', '-', 'testing');
  });

  it('logs event', () => {
    logger.event('testing');
    expect(consoleMock).toHaveBeenCalledTimes(1);
    expect(consoleMock).toHaveBeenCalledWith('[Just]', 'event', '-', 'testing');
  });

  it('logs error', () => {
    logger.error('testing');
    expect(consoleMock).toHaveBeenCalledTimes(1);
    expect(consoleMock).toHaveBeenCalledWith('[Just]', 'error', '-', 'testing');
  });

  it('logs warning', () => {
    logger.warning('testing');
    expect(consoleMock).toHaveBeenCalledTimes(1);
    expect(consoleMock).toHaveBeenCalledWith('[Just]', 'warning', '-', 'testing');
  });

  it('logs debug when JUST_DEBUG is set', () => {
    process.env.JUST_DEBUG = 'TRUE';
    logger.debug('testing');
    expect(consoleMock).toHaveBeenCalledTimes(1);
    expect(consoleMock).toHaveBeenCalledWith('[Just]', 'DEBUG', '-', 'testing');
    delete process.env.JUST_DEBUG;
  });

  it('does not log debug when JUST_DEBUG is not set', () => {
    delete process.env.JUST_DEBUG;
    logger.debug('testing');
    expect(consoleMock).toHaveBeenCalledTimes(0);
  });

  it('logs info', () => {
    logger.info('testing');
    expect(consoleMock).toHaveBeenCalledTimes(1);
    expect(consoleMock).toHaveBeenCalledWith('[Just]', 'info', '-', 'testing');
  });
});
