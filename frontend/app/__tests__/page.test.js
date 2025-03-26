import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Home from "../page";
import "@testing-library/jest-dom";
import { useRouter } from "next/navigation";

// Mock useRouter
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

beforeAll(() => {
  // ✅ Mock URL.createObjectURL to prevent Jest error
  global.URL.createObjectURL = jest.fn(() => "mocked-url");
});

describe("Home Page", () => {
  beforeEach(() => {
    useRouter.mockReturnValue({ push: jest.fn() });
  });

  test("renders Home page correctly", () => {
    render(<Home />);
    expect(screen.getByText("Ukshati Technologies Private Ltd.")).toBeInTheDocument();
    expect(screen.getByText("Welcome!!")).toBeInTheDocument();
  });

  test("navigates to login when 'Explore' is clicked", () => {
    const pushMock = jest.fn();
    useRouter.mockReturnValue({ push: pushMock });

    render(<Home />);
    fireEvent.click(screen.getByText("Explore"));

    expect(pushMock).toHaveBeenCalledWith("/login");
  });

  test("opens and closes the About Us modal", async () => {
    render(<Home />);

    // Open modal
    fireEvent.click(screen.getByText("About Us"));
    expect(screen.getByText("At Ukshati Technologies Pvt Ltd")).toBeInTheDocument();

    // Close modal
    fireEvent.click(screen.getByText("Close"));
    await waitFor(() => {
      expect(screen.queryByText("At Ukshati Technologies Pvt Ltd")).not.toBeInTheDocument();
    });
  });

  test("triggers the download functionality", async () => {
    render(<Home />);

    global.fetch = jest.fn(() =>
      Promise.resolve({
        blob: () => Promise.resolve(new Blob(["test"], { type: "application/pdf" })),
      })
    );

    fireEvent.click(screen.getByText("Download"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/Ukshati_User_Manual.pdf");
    });
  });
});
