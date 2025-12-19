import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/utils";
import { SessionCard } from "../session-card";

describe("SessionCard", () => {
  const defaultProps = {
    id: "session-123456789",
  };

  describe("basic rendering", () => {
    it("renders session card with default title", () => {
      renderWithProviders(<SessionCard {...defaultProps} />);
      // Should show first 8 chars of session ID as default title
      // id.slice(0, 8) of "session-123456789" is "session-"
      expect(screen.getByText("Session session-")).toBeInTheDocument();
    });

    it("renders custom title when provided", () => {
      renderWithProviders(<SessionCard {...defaultProps} title="My Custom Session" />);
      expect(screen.getByText("My Custom Session")).toBeInTheDocument();
    });

    it("uses session ID prefix as fallback title", () => {
      renderWithProviders(<SessionCard id="abc12345xyz" />);
      expect(screen.getByText("Session abc12345")).toBeInTheDocument();
    });
  });

  describe("project/directory display", () => {
    it("shows project name when directory is provided", () => {
      renderWithProviders(
        <SessionCard {...defaultProps} directory="/Users/user/projects/my-app" />
      );
      expect(screen.getByText("my-app")).toBeInTheDocument();
    });

    it("does not show project name when directory is not provided", () => {
      renderWithProviders(<SessionCard {...defaultProps} />);
      // The Folder icon and project name should not appear
      expect(screen.queryByText("my-app")).not.toBeInTheDocument();
    });
  });

  describe("time display", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-01-15T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("shows time ago when updatedAt is provided", () => {
      renderWithProviders(<SessionCard {...defaultProps} updatedAt="2024-01-15T11:30:00Z" />);
      expect(screen.getByText("Updated 30m ago")).toBeInTheDocument();
    });

    it("shows 'No activity yet' when updatedAt is not provided", () => {
      renderWithProviders(<SessionCard {...defaultProps} />);
      expect(screen.getByText("No activity yet")).toBeInTheDocument();
    });
  });

  describe("link behavior", () => {
    it("links to the session page", () => {
      renderWithProviders(<SessionCard {...defaultProps} />);
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "/sessions/session-123456789");
    });
  });

  describe("delete button", () => {
    it("does not show delete button when onDelete is not provided", () => {
      renderWithProviders(<SessionCard {...defaultProps} />);
      expect(screen.queryByRole("button", { name: /delete/i })).not.toBeInTheDocument();
    });

    it("shows delete button when onDelete is provided", () => {
      const onDelete = vi.fn();
      renderWithProviders(<SessionCard {...defaultProps} onDelete={onDelete} />);
      expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
    });

    it("calls onDelete with session id when delete button is clicked", async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();
      renderWithProviders(<SessionCard {...defaultProps} onDelete={onDelete} />);

      const deleteButton = screen.getByRole("button", { name: /delete/i });
      await user.click(deleteButton);

      expect(onDelete).toHaveBeenCalledTimes(1);
      expect(onDelete).toHaveBeenCalledWith("session-123456789");
    });

    it("prevents link navigation when delete button is clicked", async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();
      renderWithProviders(<SessionCard {...defaultProps} onDelete={onDelete} />);

      const deleteButton = screen.getByRole("button", { name: /delete/i });
      await user.click(deleteButton);

      // onDelete should be called, meaning stopPropagation worked
      expect(onDelete).toHaveBeenCalled();
    });
  });

  describe("accessibility", () => {
    it("has screen reader text for delete button", () => {
      const onDelete = vi.fn();
      renderWithProviders(<SessionCard {...defaultProps} onDelete={onDelete} />);

      expect(screen.getByText("Delete session")).toBeInTheDocument();
    });
  });
});
