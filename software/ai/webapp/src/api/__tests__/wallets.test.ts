import { fetchWallets, fetchWallet, createWallet, deleteWallet } from "../wallets";
import { apiClient } from "../client";

jest.mock("../client");

const mockedApiClient = apiClient as jest.MockedFunction<typeof apiClient>;

describe("fetchWallets", () => {
  it("calls apiClient with /wallets", async () => {
    const wallets = [
      {
        id: "1",
        address: "0x1234",
        name: "Wallet 1",
        chainId: 8453,
        agentCount: 0,
        totalSpent: "0",
        createdAt: "2024-01-01T00:00:00Z",
      },
    ];
    mockedApiClient.mockResolvedValue(wallets);

    const result = await fetchWallets();

    expect(mockedApiClient).toHaveBeenCalledWith("/wallets");
    expect(result).toEqual(wallets);
  });
});

describe("fetchWallet", () => {
  it("calls apiClient with /wallets/:id", async () => {
    const wallet = {
      id: "1",
      address: "0x1234",
      name: "Wallet 1",
      chainId: 8453,
      agentCount: 0,
      totalSpent: "0",
      createdAt: "2024-01-01T00:00:00Z",
    };
    mockedApiClient.mockResolvedValue(wallet);

    const result = await fetchWallet("1");

    expect(mockedApiClient).toHaveBeenCalledWith("/wallets/1");
    expect(result).toEqual(wallet);
  });
});

describe("createWallet", () => {
  it("calls apiClient with POST method", async () => {
    const newWallet = {
      id: "2",
      address: "0xabcd",
      name: "New Wallet",
      chainId: 1,
      agentCount: 0,
      totalSpent: "0",
      createdAt: "2024-01-01T00:00:00Z",
    };
    mockedApiClient.mockResolvedValue(newWallet);

    const result = await createWallet({ name: "New Wallet", chainId: 1 });

    expect(mockedApiClient).toHaveBeenCalledWith("/wallets", {
      method: "POST",
      body: JSON.stringify({ name: "New Wallet", chainId: 1 }),
    });
    expect(result).toEqual(newWallet);
  });
});

describe("deleteWallet", () => {
  it("calls apiClient with DELETE method", async () => {
    mockedApiClient.mockResolvedValue(undefined);

    await deleteWallet("1");

    expect(mockedApiClient).toHaveBeenCalledWith("/wallets/1", {
      method: "DELETE",
    });
  });
});
