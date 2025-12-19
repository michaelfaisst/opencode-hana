import { render, screen } from "@testing-library/react";
import { ConnectionStatus } from "../connection-status";

describe("ConnectionStatus", () => {
  describe("when connected", () => {
    it("shows 'Connected' text", () => {
      render(<ConnectionStatus isConnected />);
      expect(screen.getByText("Connected")).toBeInTheDocument();
    });

    it("does not show 'Disconnected' text", () => {
      render(<ConnectionStatus isConnected />);
      expect(screen.queryByText("Disconnected")).not.toBeInTheDocument();
    });

    it("applies green text color class", () => {
      render(<ConnectionStatus isConnected />);
      const container = screen.getByText("Connected").parentElement;
      expect(container).toHaveClass("text-green-500");
    });

    it("does not apply destructive text color", () => {
      render(<ConnectionStatus isConnected />);
      const container = screen.getByText("Connected").parentElement;
      expect(container).not.toHaveClass("text-destructive");
    });
  });

  describe("when disconnected", () => {
    it("shows 'Disconnected' text", () => {
      render(<ConnectionStatus isConnected={false} />);
      expect(screen.getByText("Disconnected")).toBeInTheDocument();
    });

    it("does not show 'Connected' text", () => {
      render(<ConnectionStatus isConnected={false} />);
      expect(screen.queryByText("Connected")).not.toBeInTheDocument();
    });

    it("applies destructive text color class", () => {
      render(<ConnectionStatus isConnected={false} />);
      const container = screen.getByText("Disconnected").parentElement;
      expect(container).toHaveClass("text-destructive");
    });

    it("does not apply green text color", () => {
      render(<ConnectionStatus isConnected={false} />);
      const container = screen.getByText("Disconnected").parentElement;
      expect(container).not.toHaveClass("text-green-500");
    });
  });

  describe("className prop", () => {
    it("applies custom className when connected", () => {
      render(<ConnectionStatus isConnected className="custom-class" />);
      const container = screen.getByText("Connected").parentElement;
      expect(container).toHaveClass("custom-class");
    });

    it("applies custom className when disconnected", () => {
      render(<ConnectionStatus isConnected={false} className="another-class" />);
      const container = screen.getByText("Disconnected").parentElement;
      expect(container).toHaveClass("another-class");
    });

    it("merges custom className with default classes", () => {
      render(<ConnectionStatus isConnected className="custom-class" />);
      const container = screen.getByText("Connected").parentElement;
      expect(container).toHaveClass("custom-class");
      expect(container).toHaveClass("text-green-500");
      expect(container).toHaveClass("text-xs");
    });
  });
});
