export const documentDirectory = '/mock/documents/';
export const cacheDirectory = '/mock/cache/';

export const getInfoAsync = jest.fn().mockResolvedValue({ exists: false, isDirectory: false });
export const makeDirectoryAsync = jest.fn().mockResolvedValue(undefined);
export const copyAsync = jest.fn().mockResolvedValue(undefined);
export const deleteAsync = jest.fn().mockResolvedValue(undefined);
export const readAsStringAsync = jest.fn().mockResolvedValue('');
export const writeAsStringAsync = jest.fn().mockResolvedValue(undefined);
export const readDirectoryAsync = jest.fn().mockResolvedValue([]);
export const moveAsync = jest.fn().mockResolvedValue(undefined);

export const EncodingType = { Base64: 'base64', UTF8: 'utf8' };
