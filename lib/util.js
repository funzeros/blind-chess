(function (global) {
  function useRandom(seed = Date.now()) {
    return () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280.0;
    };
  }
  register(useRandom.name, useRandom);

  function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }
  register(sleep.name, sleep);
})(this);
