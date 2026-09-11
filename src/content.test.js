import test from "node:test";
import assert from "node:assert/strict";
import { IDEAS, THEMES, classifyTheme, generateComments } from "./content.js";

test("the idea library has substantial distinct coverage and explicit bad bets", () => {
  assert.ok(IDEAS.length >= 160);
  assert.equal(new Set(IDEAS.map((idea) => idea[1])).size, IDEAS.length);
  assert.equal(IDEAS[0][1], "Meeting Mortality Calculator");
  for (const theme of THEMES) {
    assert.ok(
      IDEAS.filter((idea) => idea[0] === theme.id).length >= 12,
      theme.id,
    );
  }
  assert.ok(IDEAS.filter((idea) => idea[3] && idea[3] < 35).length >= 16);
});

test("custom briefs select relevant themes and respect a fallback", () => {
  assert.equal(
    classifyTheme("a game for speedrunners on Steam", "tools"),
    "gaming",
  );
  assert.equal(
    classifyTheme("track my dog's vet appointments", "tools"),
    "pets",
  );
  assert.equal(
    classifyTheme("clean CSV spreadsheets and fix tickets", "pets"),
    "tools",
  );
  assert.equal(
    classifyTheme("cook recipes from fridge leftovers", "tools"),
    "food",
  );
  assert.equal(
    classifyTheme("actually make the button work", "education"),
    "education",
  );
  assert.equal(classifyTheme(undefined, "food"), "food");
});

test("launch discussions are seeded, distinct, relevant and outcome aware", () => {
  const idea = {
    id: "idea-8",
    title: "Cat Invoice Department",
    category: "pets",
  };
  const comments = generateComments(idea, "flop", 81);
  assert.deepEqual(comments, generateComments(idea, "flop", 81));
  assert.notDeepEqual(comments, generateComments(idea, "hit", 81));
  assert.notDeepEqual(comments, generateComments(idea, "flop", 82));
  assert.ok(comments.length >= 4 && comments.length <= 6);
  assert.equal(
    new Set(comments.map((comment) => comment.text)).size,
    comments.length,
  );
  assert.equal(
    new Set(comments.map((comment) => comment.id)).size,
    comments.length,
  );
  assert.ok(comments.some((comment) => comment.text.includes(idea.title)));
  assert.ok(
    comments.some((comment) =>
      /cat|dog|pet|vet|treat|paw|litter/i.test(comment.text),
    ),
  );
  assert.ok(
    comments.every(
      (comment) =>
        comment.handle.startsWith("@") &&
        Number.isInteger(comment.likes) &&
        comment.likes >= 0,
    ),
  );
});

test("every theme can produce a discussion without missing placeholders", () => {
  for (const theme of THEMES) {
    const comments = generateComments(
      { title: "<script>still just text</script>", category: theme.id },
      "steady",
      theme.id,
    );
    assert.equal(comments.length, 5);
    assert.ok(
      comments.every(
        (comment) =>
          typeof comment.text === "string" &&
          !comment.text.includes("undefined"),
      ),
    );
  }
});

test("keyword replies match actual subjects, not fragments of unrelated words", () => {
  for (let seed = 1; seed <= 30; seed++) {
    const comments = generateComments(
      {
        title: "Meeting Mortality Calculator",
        category: "tools",
        description: "Meeting time into remaining life.",
      },
      "steady",
      seed,
    );
    assert.ok(
      !comments.some((comment) =>
        /cat has reviewed|cat would like/i.test(comment.text),
      ),
    );
  }
});
