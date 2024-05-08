import { zip, unzip } from 'fflate'

export function zipAsync(file) {
  return new Promise((res, rej) => {
    zip(file, { mtime: new Date('1/1/1980') }, (err, data) => {
      if (err) {
        rej(err);
        return;
      }
      res(data);
    });
  });
}

export function unzipAsync(data) {
  return new Promise((res, rej) => {
    unzip(data, {}, (err, data) => {
      if (err) {
        rej(err);
        return;
      }
      res(data);
    });
  });
}