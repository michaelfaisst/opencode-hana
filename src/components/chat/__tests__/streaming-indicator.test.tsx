import { render, screen } from "@testing-library/react";
import { StreamingIndicator } from "../streaming-indicator";

describe("StreamingIndicator", () => {
    describe("when isBusy is false and no retry status", () => {
        it("renders nothing", () => {
            const { container } = render(<StreamingIndicator />);
            expect(container.firstChild).toBeNull();
        });

        it("renders nothing when isBusy is explicitly false", () => {
            const { container } = render(<StreamingIndicator isBusy={false} />);
            expect(container.firstChild).toBeNull();
        });
    });

    describe("when isBusy is true", () => {
        it("shows thinking indicator", () => {
            render(<StreamingIndicator isBusy />);
            expect(
                screen.getByText("Assistant is thinking...")
            ).toBeInTheDocument();
        });

        it("shows animated dots", () => {
            render(<StreamingIndicator isBusy />);
            const dots = screen.getAllByText(".");
            expect(dots).toHaveLength(3);
        });

        it("applies custom className", () => {
            render(<StreamingIndicator isBusy className="custom-class" />);
            const indicator = screen.getByText(
                "Assistant is thinking..."
            ).parentElement;
            expect(indicator).toHaveClass("custom-class");
        });
    });

    describe("when retry status is provided", () => {
        const mockRetryStatus = {
            type: "retry" as const,
            attempt: 2,
            message: "Rate limited",
            next: Date.now() + 5000
        };

        it("shows retry message instead of thinking indicator", () => {
            render(<StreamingIndicator isBusy retryStatus={mockRetryStatus} />);

            expect(
                screen.getByText(/Retrying \(attempt 2\)/)
            ).toBeInTheDocument();
            expect(screen.getByText(/Rate limited/)).toBeInTheDocument();
            expect(
                screen.queryByText("Assistant is thinking...")
            ).not.toBeInTheDocument();
        });

        it("shows the retry attempt number", () => {
            render(<StreamingIndicator retryStatus={mockRetryStatus} />);
            expect(screen.getByText(/attempt 2/)).toBeInTheDocument();
        });

        it("shows next attempt time", () => {
            render(<StreamingIndicator retryStatus={mockRetryStatus} />);
            expect(screen.getByText(/Next attempt at/)).toBeInTheDocument();
        });

        it("prioritizes retry status over isBusy", () => {
            render(<StreamingIndicator isBusy retryStatus={mockRetryStatus} />);

            // Should show retry, not thinking
            expect(screen.getByText(/Retrying/)).toBeInTheDocument();
            expect(
                screen.queryByText("Assistant is thinking...")
            ).not.toBeInTheDocument();
        });

        it("applies custom className to retry indicator", () => {
            render(
                <StreamingIndicator
                    retryStatus={mockRetryStatus}
                    className="retry-custom"
                />
            );
            const indicator = screen.getByText(/Retrying/).parentElement;
            expect(indicator).toHaveClass("retry-custom");
        });
    });
});
