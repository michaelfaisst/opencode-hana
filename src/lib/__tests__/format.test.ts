import { getProjectName, getTimeAgo, getTimeAgoShort } from "../format";

describe("getProjectName", () => {
    it("extracts the last segment from a path", () => {
        expect(
            getProjectName("/Users/michaelfaisst/Work/Private/opencode-web")
        ).toBe("opencode-web");
    });

    it("handles paths with multiple segments", () => {
        expect(getProjectName("/home/user/projects/my-app")).toBe("my-app");
    });

    it("returns 'global' for root path", () => {
        expect(getProjectName("/")).toBe("global");
    });

    it("handles paths without leading slash", () => {
        expect(getProjectName("projects/my-app")).toBe("my-app");
    });

    it("handles single segment paths", () => {
        expect(getProjectName("my-app")).toBe("my-app");
        expect(getProjectName("/my-app")).toBe("my-app");
    });

    it("handles empty string", () => {
        expect(getProjectName("")).toBe("");
    });

    it("handles paths with trailing slash", () => {
        expect(getProjectName("/Users/user/project/")).toBe("project");
    });
});

describe("getTimeAgo", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2024-01-15T12:00:00Z"));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("returns 'just now' for times less than a minute ago", () => {
        const date = new Date("2024-01-15T11:59:30Z");
        expect(getTimeAgo(date)).toBe("just now");
    });

    it("returns minutes ago for times less than an hour ago", () => {
        const date = new Date("2024-01-15T11:30:00Z");
        expect(getTimeAgo(date)).toBe("30m ago");
    });

    it("returns hours ago for times less than a day ago", () => {
        const date = new Date("2024-01-15T09:00:00Z");
        expect(getTimeAgo(date)).toBe("3h ago");
    });

    it("returns days ago for times less than a week ago", () => {
        const date = new Date("2024-01-13T12:00:00Z");
        expect(getTimeAgo(date)).toBe("2d ago");
    });

    it("returns formatted date for times more than a week ago", () => {
        const date = new Date("2024-01-01T12:00:00Z");
        // toLocaleDateString output depends on locale, just check it doesn't have 'ago'
        const result = getTimeAgo(date);
        expect(result).not.toContain("ago");
    });

    it("handles edge cases at boundaries", () => {
        // Exactly 1 minute ago
        const oneMinAgo = new Date("2024-01-15T11:59:00Z");
        expect(getTimeAgo(oneMinAgo)).toBe("1m ago");

        // Exactly 1 hour ago
        const oneHourAgo = new Date("2024-01-15T11:00:00Z");
        expect(getTimeAgo(oneHourAgo)).toBe("1h ago");

        // Exactly 1 day ago
        const oneDayAgo = new Date("2024-01-14T12:00:00Z");
        expect(getTimeAgo(oneDayAgo)).toBe("1d ago");
    });
});

describe("getTimeAgoShort", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2024-01-15T12:00:00Z"));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("returns 'just now' for times less than a minute ago", () => {
        const date = new Date("2024-01-15T11:59:30Z");
        expect(getTimeAgoShort(date)).toBe("just now");
    });

    it("returns minutes without 'ago' suffix", () => {
        const date = new Date("2024-01-15T11:30:00Z");
        expect(getTimeAgoShort(date)).toBe("30m");
        expect(getTimeAgoShort(date)).not.toContain("ago");
    });

    it("returns hours without 'ago' suffix", () => {
        const date = new Date("2024-01-15T09:00:00Z");
        expect(getTimeAgoShort(date)).toBe("3h");
        expect(getTimeAgoShort(date)).not.toContain("ago");
    });

    it("returns days without 'ago' suffix", () => {
        const date = new Date("2024-01-13T12:00:00Z");
        expect(getTimeAgoShort(date)).toBe("2d");
        expect(getTimeAgoShort(date)).not.toContain("ago");
    });

    it("returns formatted date for times more than a week ago", () => {
        const date = new Date("2024-01-01T12:00:00Z");
        const result = getTimeAgoShort(date);
        expect(result).not.toContain("ago");
        expect(result).not.toBe("14d"); // Should be formatted date, not days
    });
});
