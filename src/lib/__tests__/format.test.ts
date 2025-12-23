import {
    getProjectName,
    getTimeAgo,
    getTimeAgoShort,
    formatTimestamp
} from "../format";

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

describe("formatTimestamp", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2024-06-15T14:30:00Z"));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("returns time only for timestamps from today", () => {
        // Same day as the mocked system time
        const todayTimestamp = new Date("2024-06-15T10:45:00Z").getTime();
        const result = formatTimestamp(todayTimestamp);

        // Should contain time but not date parts
        expect(result).toMatch(/\d{1,2}:\d{2}/); // Time format like "10:45" or "10:45 AM"
        expect(result).not.toContain("Jun");
        expect(result).not.toContain("2024");
    });

    it("returns month + day + time for timestamps from this year but not today", () => {
        // Different day, same year
        const thisYearTimestamp = new Date("2024-03-20T09:15:00Z").getTime();
        const result = formatTimestamp(thisYearTimestamp);

        // Should contain month, day, and time but not year
        expect(result).toContain("Mar");
        expect(result).toContain("20");
        expect(result).toMatch(/\d{1,2}:\d{2}/);
        expect(result).not.toContain("2024");
    });

    it("returns full date with year for timestamps from previous years", () => {
        // Different year
        const lastYearTimestamp = new Date("2023-12-25T18:00:00Z").getTime();
        const result = formatTimestamp(lastYearTimestamp);

        // Should contain month, day, year, and time
        expect(result).toContain("Dec");
        expect(result).toContain("25");
        expect(result).toContain("2023");
        expect(result).toMatch(/\d{1,2}:\d{2}/);
    });

    it("handles midnight timestamps correctly", () => {
        const midnightTimestamp = new Date("2024-06-15T00:00:00Z").getTime();
        const result = formatTimestamp(midnightTimestamp);

        // Should still show time only since it's today
        expect(result).toMatch(/\d{1,2}:\d{2}/);
        expect(result).not.toContain("Jun");
    });

    it("handles year boundary correctly", () => {
        // A date clearly in the previous year (early December 2023)
        const previousYear = new Date("2023-12-15T12:00:00Z").getTime();
        const result = formatTimestamp(previousYear);

        // Should include year since it's from previous year
        expect(result).toContain("2023");
        expect(result).toContain("Dec");
    });

    it("handles timestamps from future years", () => {
        const futureTimestamp = new Date("2025-01-01T12:00:00Z").getTime();
        const result = formatTimestamp(futureTimestamp);

        // Future year should include the year
        expect(result).toContain("2025");
        expect(result).toContain("Jan");
    });
});
