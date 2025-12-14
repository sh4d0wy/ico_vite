/** @format */

import React, { useEffect, useRef, useState, useTransition } from "react";
import Big from "big.js";
import Swal from "sweetalert2";
import "./Swap.css";
import {
  useWeb3ModalProvider,
  useWeb3ModalAccount,
} from "@web3modal/ethers/react";
import { toast } from "react-toastify";
import { Contract, Network, ethers } from "ethers";
import {
  bnbChainId,
  chain,
  presaleAbi,
  presaleAddress,
  rpcUrl,
  token,
  tokenAbi,
  tokenAddress,
  tokenSymbol,
  USDT,
  usdtAbi,
  usdtAddress,
} from "./utils/constants";
import helperFunctions from "./utils/helper";
import {
  copyToClipboard,
  deci,
  deciB,
  formatNumber,
  formatToEllipsis,
  presaleStates,
} from "./utils/utils.js";
import { useTranslation } from "react-i18next";
function Swap() {
  const { t } = useTranslation();
  const { address, chainId, isConnected } = useWeb3ModalAccount();
  const { walletProvider } = useWeb3ModalProvider();

  const [presaleContract, setPresaleContract] = useState(null);
  const [tokenContract, setTokenContract] = useState(null);
  const [saleTokenContract, setSaleTokenContract] = useState(null);

  const [totalTime, setTotalTime] = useState(0);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  const [roundAmount, setRoundAmount] = useState(0);
  const [roundRate, setRoundRate] = useState(0);
  const [tokenPrice, setTokenPrice] = useState(0);

  const [curRoundIndex, setCurRoundIndex] = useState(0);
  const [totalRounds, setTotalRounds] = useState(0);
  const [nextRoundPrice, setNextRoundPrice] = useState(0);

  const [bnbBalance, setBNBBalance] = useState(0);
  const [usdtBalance, setUSDTBalance] = useState(0);

  const [userBalance, setUserBalance] = useState({
    tokenForSale: deci(0),
  });

  const [totalTokensSold, setTotalTokensSold] = useState(0);
  const [tokensInPresale, setTokensInPresale] = useState(0);
  const [availableForPurchase, setAvailableForPurchase] = useState(0);
  const [bnbSelected, setBnbSelected] = useState(true);
  const [timeText, setTimeText] = useState("");

  const [saleState, setSaleState] = useState(presaleStates.IN_FUTURE);
  const [saleStateText, setSaleStateText] = useState("");
  const [amountUsdtPay, setAmountUsdtPay] = useState(1);
  const [amountBnbPay, setAmountBnbPay] = useState(1);
  const [amountTokenReceivedBnb, setAmountTokenReceivedBnb] = useState(0);
  const [amountTokenReceivedUsdt, setAmountTokenReceivedUsdt] = useState(0);
  let timerIntervalId = 0;
  const timerRef = useRef();

  const [timerData, setTimerData] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [soldPercent, setSoldPercentage] = useState(0);

  const syncPresaleDetails = async (_presaleContract) => {
    try {
      let _roundIndex = Number(await _presaleContract.getCurrentRoundIndex());
      setCurRoundIndex(_roundIndex);
      let _totalRounds = Number(await _presaleContract.totalRounds());
      setTotalRounds(_totalRounds);
      console.log("toal", _totalRounds);

      let _roundDetails = await _presaleContract.rounds(_roundIndex);
      setRoundRate(_roundDetails[0].toString());
      let tokenPrice = parseFloat(
        (parseFloat(100000) / parseFloat(_roundDetails[0])).toFixed(4)
      );
      setTokenPrice(tokenPrice);

      let _nextRoundDetails = await _presaleContract.rounds(
        Math.min(_roundIndex + 1, _totalRounds - 1)
      );

      let _nextRoundPrice = parseFloat(
        (parseFloat(100000) / parseFloat(_nextRoundDetails[0])).toFixed(4)
      );

      setNextRoundPrice(_nextRoundPrice);

      let _startTime = await _presaleContract.startTime();
      setStartDate(new Date(Number(_startTime) * 1000));

      let _endTime = _roundDetails[1];
      setEndDate(new Date(Number(_endTime) * 1000));
      setTotalTime(parseInt(_endTime));

      let totalTokensSold = await _presaleContract.totalTokensSold();
      setTotalTokensSold(parseInt(totalTokensSold));
      let totalTokenInPresale = await _presaleContract.totalTokenInPresale();
      setTokensInPresale(parseInt(totalTokenInPresale));
      let availableForPurchase = await _presaleContract.getTokenBalance();
      setAvailableForPurchase(parseInt(availableForPurchase));

      let soldPrecentage =
        parseFloat(totalTokenInPresale) === 0
          ? 0
          : (
              parseFloat(totalTokensSold) / parseFloat(totalTokenInPresale)
            ).toFixed(4) * 100;
      console.log(
        "data here",
        totalTokensSold,
        totalTokenInPresale,
        soldPrecentage,
        "here"
      );
      setSoldPercentage(soldPrecentage);
    } catch (error) {
      console.log(error);
    }
  };
  const getInitialValues = async () => {
    try {
      const network = new ethers.Network(chain.currency, chain.chainId);
      let provider = new ethers.JsonRpcProvider(rpcUrl, network, {
        staticNetwork: true,
        batchMaxCount: 1,
      });
      let _presaleContract = new Contract(presaleAddress, presaleAbi, provider);
      syncPresaleDetails(_presaleContract);
    } catch (error) {
      console.log(error);
    }
  };
  const init = async () => {
    try {
      if (!isConnected) return;
      const provider = new ethers.BrowserProvider(walletProvider);
      let _bnbBalance = await provider.getBalance(address);
      setBNBBalance(parseInt(_bnbBalance));
      console.log("bnb balance", _bnbBalance);
      const signer = await provider.getSigner();
      const contract = new Contract(presaleAddress, presaleAbi, signer);
      setPresaleContract(contract);
      const _tokenContract = new Contract(usdtAddress, usdtAbi, signer);
      setTokenContract(_tokenContract);
      const _saleTokenContract = new Contract(tokenAddress, tokenAbi, provider);
      setSaleTokenContract(_saleTokenContract);
    } catch (error) {
      console.log(error);
      toast.info(t("something_went_wrong"));
    }
  };

  const getMe2DecimalPointsWithCommas = (amount) => {
    return Number(amount).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };
  const dividor = (a, b) => {
    return deciB(a).div(deciB(b));
  };
  const fromWei = (amount) => {
    return deci(amount)
      .div(10 ** 18)
      .toString();
  };
  const getFormattedAmount = (amount) => {
    return getMe2DecimalPointsWithCommas(fromWei(amount));
  };
  const getSaleStateTextForTimer = (saleState) => {
    console.log(saleState);
    if (saleState === presaleStates.EXPIRED) {
      return t("expired");
    } else if (saleState === presaleStates.IN_FUTURE) {
      return t("before_sale_start");
    } else if (saleState === presaleStates.RUNNING) {
      return t("before_sale_end");
    } else if (saleState === presaleStates.SOLD_OUT) {
      return t("sold_out");
    }
  };
  const getSaleState = () => {
    let curTime = Date.now();
    let startTime = startDate.getTime();
    let endTime = endDate.getTime();

    if (deci(totalTokensSold).gte(tokensInPresale)) {
      return presaleStates.EXPIRED;
    }
    // console.log("this here" , totalTokensSold , tokensInPresale , deci(totalTokensSold).gte(tokensInPresale))

    if (curTime < startTime) {
      return presaleStates.IN_FUTURE;
    } else if (curTime >= startTime && curTime < endTime) {
      return presaleStates.RUNNING;
    } else {
      console.log(curTime, startTime, endTime);
      return presaleStates.EXPIRED;
    }
  };
  const fetchDetails = async () => {
    try {
      if (!presaleContract) return;
      syncPresaleDetails(presaleContract);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchUsdtBalance = async () => {
    try {
      if (!tokenContract) return;
      let balance = deci(
        Number(await tokenContract.balanceOf(address))
      ).toString();
      console.log("usd balance", balance);
      setUSDTBalance(balance);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchSaleTokenBalance = async () => {
    try {
      if (!saleTokenContract) return;
      let balance = deciB(await saleTokenContract.balanceOf(address));
      setUserBalance({
        ...userBalance,
        tokenForSale: balance,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const maxToken = (isBnb) => {
    if (isBnb) {
      setAmountBnbPay(fromWei(bnbBalance));
    } else {
      console.log(fromWei(usdtBalance), usdtBalance);
      setAmountUsdtPay(
        deci(usdtBalance)
          .div(10 ** 6)
          .toFixed(0)
      );
    }
    // Calculate maximum token amount user can buy
    // Update state variables as needed
  };

  const approveTokens = async (amount) => {
    try {
      if (!tokenContract) return false;
      let res = await tokenContract.approve(presaleAddress, amount.toString());
      await res.wait();
      return true;
    } catch (error) {
      throw error;
    }
  };

  const clearInputs = () => {
    setAmountBnbPay(0);
    setAmountUsdtPay(0);
  };

  const buyWithUSDT = async () => {
    try {
      if (chainId !== bnbChainId) {
        Swal.fire(t("warning"), t("switch_chain_to_bsc"), "warning");
        return;
      }
      if (!isConnected) {
        Swal.fire(t("warning"), t("connect_wallet_first"), "warning");
        return;
      }
      let purchasableAmount = deci(availableForPurchase).div(10 ** 18);
      let receivableAmount = deci(amountTokenReceivedUsdt);

      if (receivableAmount.greaterThan(purchasableAmount)) {
        Swal.fire(
          t("warning"),
          t("purchase_exceeds_available_tokens"),
          "warning"
        );
        return;
      }

      let weiValue = deci(amountUsdtPay).mul(10 ** USDT.decimals);
      if (weiValue.lessThan(0)) {
        Swal.fire(t("warning"), t("amount_greater_than_zero"), "warning");
        return;
      }
      if (deci(usdtBalance).lessThan(weiValue)) {
        Swal.fire(t("warning"), t("insufficient_balance"), "warning");
        return;
      }

      setPurchaseLoading(true);

      let allowance = Number(
        await tokenContract.allowance(address, presaleAddress)
      );

      if (deci(allowance).lessThan(weiValue)) {
        if (allowance === 0) {
          await approveTokens(weiValue.toFixed(0));
        } else {
          await approveTokens(0);
          await approveTokens(weiValue.toFixed(0));
        }
      }
      //Send Purchase Transaction
      let res = await presaleContract.buyWithUSDT(weiValue.toFixed(0));
      await res.wait();
      Swal.fire(
        t("transaction_completed"),
        t("token_bought_successfully"),
        "success"
      );
      clearInputs();
      fetchDetails();
      fetchUsdtBalance();
      fetchSaleTokenBalance();
    } catch (error) {
      Swal.fire(t("warning"), t("something_went_wrong"), "warning");
    } finally {
      setPurchaseLoading(false);
    }
  };
  const buyWithBNB = async () => {
    try {
      if (chainId !== bnbChainId) {
        Swal.fire(t("warning"), t("switch_chain_to_bsc"), "warning");
        return;
      }
      if (!isConnected) {
        Swal.fire(t("warning"), t("connect_wallet_first"), "warning");
        return;
      }
      let purchasableAmount = deci(availableForPurchase).div(10 ** 18);
      let receivableAmount = deci(amountTokenReceivedBnb);
      if (receivableAmount.greaterThan(purchasableAmount)) {
        Swal.fire(
          t("warning"),
          t("purchase_exceeds_available_tokens"),
          "warning"
        );
        return;
      }

      let weiValue = deci(amountBnbPay).mul(10 ** 18);
      if (weiValue.lessThan(0)) {
        Swal.fire(t("warning"), t("amount_greater_than_zero"), "warning");
        return;
      }
      if (deci(bnbBalance).lessThan(weiValue)) {
        Swal.fire(t("warning"), t("insufficient_balance"), "warning");
        return;
      }
      setPurchaseLoading(true);

      //Send Purchase Transaction
      let res = await presaleContract.buyWithBNB({
        value: weiValue.toFixed(0),
      });
      await res.wait();
      Swal.fire(
        t("transaction_completed"),
        t("token_bought_successfully"),
        "success"
      );
      clearInputs();
      fetchDetails();
      fetchUsdtBalance();
      fetchSaleTokenBalance();
    } catch (error) {
      console.log(error);
      Swal.fire(t("warning"), t("something_went_wrong"), "warning");
    } finally {
      setPurchaseLoading(false);
    }
  };

  const buyTokens = () => {
    if (bnbSelected) {
      buyWithBNB();
    } else {
      buyWithUSDT();
    }
    // Handle token purchase
    // Update state variables as needed
  };

  const updateProgressBar = () => {
    const currentTime = Math.floor(new Date().getTime() / 1000); // Current time in seconds
    let remainingTime = 0;
    let _saleState = getSaleState();
    if (_saleState === presaleStates.IN_FUTURE) {
      remainingTime = Math.floor(startDate.getTime() / 1000) - currentTime;
    } else if (_saleState === presaleStates.RUNNING) {
      remainingTime = Math.floor(endDate.getTime() / 1000) - currentTime;
    }
    setSaleState(_saleState);
    // console.log("Remaing time", remainingTime , endDate , startDate);
    if (remainingTime <= 0) {
      if (totalTime !== 0) {
        setTimeText(t("time_expired"));
      }
    } else {
      const days = Math.floor(remainingTime / (24 * 60 * 60));
      const hours = Math.floor((remainingTime % (24 * 60 * 60)) / (60 * 60));
      const minutes = Math.floor((remainingTime % (60 * 60)) / 60);
      const seconds = Math.floor(remainingTime % 60);
      let res = `${days}d : ${hours}h : ${minutes}m : ${seconds}s`;
      setTimeText(res);
      setTimerData({
        days,
        minutes,
        hours,
        seconds,
      });
    }
  };

  // Function to start the countdown
  function startCountdown() {
    timerRef.current = setInterval(() => {
      updateProgressBar();
    }, 1000);
  }

  const watchAsset = async () => {
    if (!walletProvider) {
      Swal.fire(t("connect_wallet_first"), "", "warning");
      return;
    }
    try {
      await walletProvider.request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20", // The standard of the token (ERC20)
          options: {
            address: tokenAddress, // The contract address of the token
            symbol: token.symbol, // The symbol of the token
            decimals: token.decimals, // The number of decimals of the token
            image: token.image, // The image of the token
          },
        },
      });
      Swal.fire(t("token_imported"), "", "success");
    } catch (error) {
      Swal.fire(
        t("wallet_not_supported"),
        t("import_token_manually"),
        "warning"
      );
      console.log(error);
    }
  };
  useEffect(() => {
    // clearInterval(timerRef.current)
    startCountdown();
    console.log(
      "updated time values",
      totalTime,
      startDate,
      endDate,
      timerRef.current
    );
    return () => {
      clearInterval(timerRef.current);
    };
  }, [totalTime, startDate, endDate, startCountdown]);

  useEffect(() => {
    let cal = async () => {
      try {
        let amount = amountBnbPay.toString().trim();
        if (amount.length === 0) {
          setAmountTokenReceivedBnb("0.00");
          return;
        }
        let parsedAmount = deci(amount).mul(10 ** 18);
        if (!presaleContract) return;
        let numberOfToken = await presaleContract.bnbBuyHelper(
          parsedAmount.toFixed(0)
        );
        let amountReceivable = dividor(numberOfToken, 10 ** 18)
          .toFixed(2)
          .toString();
        setAmountTokenReceivedBnb(amountReceivable);
        console.log(amountReceivable);
        console.log("Changed 2");
      } catch (error) {
        console.log(error);
      }
    };
    cal();
  }, [amountBnbPay, bnbSelected, presaleContract]);
  useEffect(() => {
    let cal = async () => {
      try {
        let amount = amountUsdtPay.toString().trim();
        if (amount.length === 0) {
          setAmountTokenReceivedUsdt("0.00");
          return;
        }
        amount = deci(amount)
          .mul(10 ** 9)
          .mul(10 ** 9)
          .toFixed(0)
          .toString();

        if (!presaleContract) return;
        let numberOfToken = await presaleContract.calculateToken(amount);
        setAmountTokenReceivedUsdt(
          dividor(numberOfToken, 10 ** 18)
            .toFixed(2)
            .toString()
        );
        console.log("Changed 1");
      } catch (error) {
        console.log(error);
      }
    };
    cal();
  }, [amountUsdtPay, presaleContract]);

  useEffect(() => {
    if (!presaleContract) return;
    fetchDetails();
  }, [presaleContract]);

  useEffect(() => {
    fetchUsdtBalance();
  }, [tokenContract]);

  useEffect(() => {}, [saleTokenContract]);

  useEffect(() => {
    init();
  }, [chainId]);

  useEffect(() => {
    getInitialValues();
    fetchSaleTokenBalance();
  }, []);

  useEffect(() => {
    console.log("this", saleState);
    setSaleStateText(getSaleStateTextForTimer(saleState));
  }, [saleState]);
  return (
    <main>
      <section className="hero-sec">
        <div className="container">
          <div className="row">
            <div className="col-md-12">
              <form>
                <div className="popup-box">
                  <div className="hero-wrap">
                    <div className="d-flex hero-heading">
                      <div>
                        <img
                          src={`/images/tier-heading-${curRoundIndex + 1}.gif`}
                          className="tier-heading-gif"
                          alt=""
                        />
                      </div>
                    </div>

                    <div className="timer-wrap">
                      <div className="timer">
                        <div className="timer-content d-flex">
                          <div className="timer-box days">
                            <h4>{timerData.days}</h4>
                            <p> {t("Days")}</p>
                          </div>
                          <div className="separator">:</div>
                          <div className="timer-box hours">
                            <h4>{timerData.hours}</h4>
                            <p>{t("Hours")}</p>
                          </div>
                          <div className="separator">:</div>
                          <div className="timer-box minutes">
                            <h4>{timerData.minutes}</h4>
                            <p>{t("Mins")}</p>
                          </div>
                          <div className="separator">:</div>
                          <div className="timer-box seconds">
                            <h4>{timerData.seconds}</h4>
                            <p>{t("Sec")}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="d-flex bsc-wrap align-items-center justify-content-center">
                      <button className="bsc-btn" type="button" disabled={true}>
                        <img src="/images/BSC-logo.png" alt="" />
                        BSC {t("network")}
                      </button>
                    </div>

                    <div className="bsc-wrap grid-2 align-items-center justify-content-center">
                      <button
                        type="button"
                        className={`bnb-btn d-btn ${
                          bnbSelected ? "selected" : ""
                        }`}
                        onClick={() => {
                          setBnbSelected(true);
                        }}
                      >
                        BNB
                      </button>
                      <button
                        type="button"
                        className={`bnb-btn d-btn ${
                          bnbSelected ? "" : "selected"
                        }`}
                        onClick={() => {
                          setBnbSelected(false);
                        }}
                      >
                        USDT
                      </button>
                    </div>

                    <p className="text-center text-white micro-text">
                      1 {tokenSymbol} = {tokenPrice}$
                    </p>

                    <div className="inputs-wrap">
                      <div className="w-100 pay-input-wrap">
                        <div className="d-flex align-items-center justify-content-between">
                          <label htmlFor="input-pay" className="input-label">
                            {t("amount_you_pay", {
                              symbol: bnbSelected ? "BNB" : "USDT",
                            })}{" "}
                          </label>
                          <button className="but-btn" type="button">
                            {t("buy_min")} $10
                          </button>
                        </div>
                        <div className="input-wrap">
                          <input
                            type="number"
                            id="input-pay"
                            className="input input-pay"
                            placeholder={0}
                            required=""
                            value={bnbSelected ? amountBnbPay : amountUsdtPay}
                            onChange={(e) => {
                              if (bnbSelected) {
                                setAmountBnbPay(e.target.value);
                              } else {
                                setAmountUsdtPay(e.target.value);
                              }
                            }}
                          />
                          <img
                            src={`./images/${
                              bnbSelected ? "BSC-logo-purple" : "usdtCircle"
                            }.png`}
                            className="bsc-logo"
                            alt="logo"
                          />
                        </div>
                      </div>
                      <div className="w-100">
                        <div className="d-flex align-items-center justify-content-between">
                          <label
                            htmlFor="input-receive"
                            className="input-label"
                          >
                            {t("amount_you_receive", { symbol: .symbol })}
                          </label>
                        </div>
                        <div className="input-wrap">
                          <input
                            type="text"
                            value={formatNumber(
                              bnbSelected
                                ? amountTokenReceivedBnb
                                : amountTokenReceivedUsdt
                            )}
                            onChange={(e) => {}}
                            readOnly={true}
                            id="input-receive"
                            className="input input-pay"
                          />
                          <img
                            src="/images/tier-logo.png"
                            className="bsc-logo"
                            alt="logo"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="">
                      {!isConnected && (
                        <div
                          className="btn btn-connect d-flex w-100 p-2 mt-3"
                          id="w3-button"
                          style={{
                            display: "flex !important",
                            justifyContent: "center",
                          }}
                        >
                          <w3m-button
                            label={t("connect_wallet")}
                            class="btn-sky w-full p-0 flex justify-center items-center "
                          />
                        </div>
                      )}
                      {isConnected && (
                        <button
                          type="button"
                          id="buy-button"
                          onClick={
                            saleState === presaleStates.RUNNING
                              ? buyTokens
                              : null
                          }
                          className="btn d-block w-100 p-2 mt-3 connect-btn"
                          style={{
                            backgroundColor: "#E78027",
                            color: "white",
                            fontSize: "16px",
                            fontWeight: "700",
                          }}
                        >
                          <div
                            style={{
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 10,
                              display: "flex",
                            }}
                          >
                            <div
                              style={{
                                display: purchaseLoading
                                  ? "inline-block"
                                  : "none",
                              }}
                              id="loader"
                              // className="btn-sky  w-full mt-3 py-4 text-xl"
                            />
                            {saleState === presaleStates.RUNNING
                              ? t("Buy Now")
                              : saleStateText}
                          </div>
                        </button>
                      )}
                      {isConnected && (
                        <div
                          className="btn btn-connect d-flex w-100 p-2 mt-3"
                          id="w3-button"
                          style={{
                            display: "flex !important",
                            justifyContent: "center",
                            background:
                              "linear-gradient(105deg, #00e5ff 0%, #ef11c9 100%)",
                          }}
                        >
                          <w3m-button
                            label={t("connect_wallet")}
                            class="btn-sky w-full p-0 flex justify-center items-center "
                          />
                        </div>
                      )}
                    </div>

                    <div className="contact-wrap">
                      <div className="d-flex gap-3 align-items-center justify-content-between">
                        <h4>{t("contract_address")}</h4>
                        <div className="d-flex align-items-center gap-2">
                          <p className="mb-0">
                            {formatToEllipsis(tokenAddress)}
                          </p>
                          <button
                            type="button"
                            className="copy-btn"
                            onClick={() => {
                              copyToClipboard(tokenAddress);
                              toast.info(t("copied"));
                            }}
                          >
                            <img src="/images/copy.png" alt="" />
                          </button>
                        </div>
                      </div>
                      <div className="d-flex gap-3 align-items-center justify-content-between">
                        <h4>{t("presale_address")}</h4>
                        <div className="d-flex align-items-center gap-2">
                          <p className="mb-0">
                            {formatToEllipsis(presaleAddress)}
                          </p>
                          <button
                            type="button"
                            className="copy-btn"
                            onClick={() => {
                              copyToClipboard(presaleAddress);
                              toast.info(t("copied"));
                            }}
                          >
                            <img src="/images/copy.png" alt="" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="warn-box">
                      <p className="text-white text-center">
                        {t("note_1")}
                        <br />
                        {t("note_2")}
                      </p>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Swap;
