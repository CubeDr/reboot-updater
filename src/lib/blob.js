const { del, get } = require("@vercel/blob");

async function streamToBuffer(stream) {
  if (!stream) {
    throw new Error("Blob content stream is empty.");
  }

  if (typeof stream.getReader === "function") {
    const reader = stream.getReader();
    const chunks = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(Buffer.from(value));
    }

    return Buffer.concat(chunks);
  }

  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

async function readPrivateBlob(url) {
  const result = await get(url, {
    access: "private",
    useCache: false,
  });

  if (!result) {
    throw new Error("업로드된 zip 파일을 Blob 저장소에서 찾을 수 없습니다.");
  }

  return streamToBuffer(result.stream);
}

async function deleteBlobQuietly(url) {
  try {
    await del(url);
  } catch (error) {
    console.warn(`Could not delete blob ${url}: ${error.message}`);
  }
}

module.exports = { deleteBlobQuietly, readPrivateBlob };
