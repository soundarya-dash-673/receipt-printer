type ConvertOpts = {html: string; fileName: string; directory?: string; base64?: boolean};

const stub = {
  convert: async (_opts: ConvertOpts) => ({filePath: ''}),
};

export default stub;
