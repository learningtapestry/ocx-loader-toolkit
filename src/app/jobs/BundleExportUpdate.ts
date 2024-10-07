import Redis from 'ioredis';

export type BundleExportUpdate = {
  status: 'exporting' | 'exported' | 'failed';
  progress: number;
  totalActivities: number;
  exportUrl?: string;
}

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export const publishBundleExportUpdate = async (bundleId: number, update: BundleExportUpdate): Promise<void> => {
  const channel = `bundle_export:${bundleId}`;
  await redis.publish(channel, JSON.stringify(update));
};

export const subscribeToBundleExportUpdates = (
  bundleId: string,
  callback: (update: BundleExportUpdate) => void
): () => void => {
  const subscriber = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  const channel = `bundle_export:${bundleId}`;

  (async () => {
    try {
      await subscriber.subscribe(channel);
    } catch (err) {
      console.error('Failed to subscribe:', err);
      return;
    }
  })();

  subscriber.on('message', (receivedChannel: string, message: string) => {
    if (receivedChannel === channel) {
      const update: BundleExportUpdate = JSON.parse(message);
      callback(update);
    }
  });

  return () => {
    subscriber.unsubscribe(channel);
    subscriber.quit();
  };
};
