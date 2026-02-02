export const parseHibpPayload = async (response: Response, suffix: string): Promise<number> => {
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    const data = await response.json();
    const match = data?.results?.find?.((entry: { suffix: string; count: number }) => entry.suffix === suffix);
    return match?.count ?? 0;
  }

  const payload = await response.text();
  return payload
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce((total, line) => {
      const [lineSuffix, count] = line.split(':');
      return lineSuffix?.toUpperCase() === suffix ? Number(count) || 0 : total;
    }, 0);
};
