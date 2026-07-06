import { describe, expect, it, vi, beforeEach } from "vitest";

const sendMock = vi.fn();

vi.mock("@aws-sdk/client-ses", () => {
  class FakeCommand {
    constructor(public input: unknown) {}
  }
  class FakeSESClient {
    send = sendMock;
  }
  return {
    SESClient: FakeSESClient,
    SendEmailCommand: class extends FakeCommand {},
  };
});

const ORIGINAL_ENV = process.env;

beforeEach(() => {
  sendMock.mockReset();
  vi.resetModules();
  process.env = { ...ORIGINAL_ENV, EMAIL_FROM_ADDRESS: "noreply@example.com", AWS_REGION: "us-east-1" };
});

describe("sendEmail", () => {
  it("sends a SendEmailCommand with the expected shape", async () => {
    sendMock.mockResolvedValue({});
    const { sendEmail } = await import("./send");

    await sendEmail({ to: "user@example.com", subject: "Hello", html: "<p>Hi</p>" });

    expect(sendMock).toHaveBeenCalledTimes(1);
    const command = sendMock.mock.calls[0][0];
    expect(command.input).toEqual({
      Source: "noreply@example.com",
      Destination: { ToAddresses: ["user@example.com"] },
      Message: {
        Subject: { Data: "Hello", Charset: "UTF-8" },
        Body: { Html: { Data: "<p>Hi</p>", Charset: "UTF-8" } },
      },
    });
  });

  it("isEmailEnabled reflects whether EMAIL_FROM_ADDRESS is set", async () => {
    const { isEmailEnabled } = await import("./client");
    expect(isEmailEnabled()).toBe(true);

    delete process.env.EMAIL_FROM_ADDRESS;
    vi.resetModules();
    const { isEmailEnabled: isEmailEnabledAgain } = await import("./client");
    expect(isEmailEnabledAgain()).toBe(false);
  });

  it("throws a clear error when EMAIL_FROM_ADDRESS is unset", async () => {
    delete process.env.EMAIL_FROM_ADDRESS;
    vi.resetModules();
    const { sendEmail } = await import("./send");

    await expect(
      sendEmail({ to: "user@example.com", subject: "Hello", html: "<p>Hi</p>" }),
    ).rejects.toThrow(/EMAIL_FROM_ADDRESS/);
  });
});
