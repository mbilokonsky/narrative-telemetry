function test(): void {
  console.log("TEST_VALUE:", process.env.TEST_VALUE)
  console.error("Debugging test value:", process.env.TEST_VALUE)
}

test()