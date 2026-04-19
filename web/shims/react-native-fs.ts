/** Web stub — native file APIs are not available in the browser bundle. */
export const DocumentDirectoryPath = '/web';
export const CachesDirectoryPath = '/web';

const stub = {
  DocumentDirectoryPath,
  CachesDirectoryPath,
  copyFile: async () => {
    throw new Error('react-native-fs is not available on web');
  },
};

export default stub;
