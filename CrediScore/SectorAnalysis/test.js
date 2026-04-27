import { getSectorScore } from "./sectorScore.js";

async function test() {
  try {
    const result = await getSectorScore("Healthcare");

    console.log(result);

  } catch (err) {
    console.error(err.message);
  }
}

test();
