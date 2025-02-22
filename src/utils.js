export function shouldSkipURL(url) {
  const skipHosts = [
    /^.*doubleclick.net$/,
    /localhost/,
    /^.*googletagmanager.com$/,
  ];

  const skipProtocols = [/^chrome.*:$/];

  const { protocol, hostname } = new URL(url);
  return (
    skipProtocols.some((re) => re.test(protocol)) ||
    skipHosts.some((re) => re.test(hostname))
  );
}

export async function getWSDebugUrl(origin) {
  return new Promise((resolve, reject) => {
    fetch("http://localhost:9222/json")
      .then((res) => res.json())
      .then((data) => {
        data.forEach(async (target) => {
          const targetOrigin = new URL(target.url).origin;
          if (targetOrigin == origin) {
            resolve(target.webSocketDebuggerUrl);
          }
        });
        reject(`webSocketDebuggerUrl not found for ${origin}`);
      })
      .catch((err) => reject(err));
  });
}