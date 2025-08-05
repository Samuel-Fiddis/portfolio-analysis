import pandas as pd

data = pd.read_csv("data.csv")

data["trade_date"] = pd.to_datetime(
    data["Year"].astype(str) + "-" + data["Month"].astype(str) + "-01"
)

data = data.drop(columns=["Year", "Month", "Maximum Sharpe Ratio Return", "Maximum Sharpe Ratio Balance"])
data = data.rename(
    columns={
        "Microsoft Corporation (MSFT)": "MSFT",
        "Apple Inc (AAPL)": "AAPL",
        "Dell Technologies Inc (DELL)": "DELL",
    }
)
data["MSFT"] = data["MSFT"].str.rstrip("%").astype(float)
data["AAPL"] = data["AAPL"].str.rstrip("%").astype(float)
data["DELL"] = data["DELL"].str.rstrip("%").astype(float)

print(data.head())

data.set_index("trade_date", inplace=True)
data = data.stack().reset_index()
data.columns = ["trade_date", "symbol", "change_percent"]
print(data)

data.to_csv("optimisation_test_data.csv", columns=['symbol', 'trade_date', 'change_percent'], index=False)