/** @format */

import React, { useEffect, useRef, useState } from "react";
// import Big from "big.js";
import Swal from "sweetalert2";
import "./Swap.css";
import { useConnection, useWalletClient, usePublicClient } from 'wagmi';
import { toast } from "react-toastify";
import { Contract, ethers } from "ethers";
import {
  bnbChainId,
  chain,
  presaleAbi,
  presaleAddress,
  rpcUrl,
  token,
  tokenAbi,
  tokenAddress,
  USDT,
  usdtAbi,
  usdtAddress,
} from "./utils/constants";
import {
  copyToClipboard,
  deci,
  deciB,
  formatNumber,
  presaleStates,
} from "./utils/utils.js";
import { useTranslation } from "react-i18next";
import clsx from "clsx";
// import { ConnectButton } from "./ConnectButton";
// import { ConnectButton } from "@rainbow-me/rainbowkit";
import { AppKitButton, AppKitConnectButton } from "@reown/appkit/react";
function Swap() {
  const { t } = useTranslation();
  
  // RainbowKit/Wagmi hooks
  const { address, isConnected, chain: currentChain } = useConnection();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  
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

      let _roundDetails = await _presaleContract.rounds(_roundIndex);
      setRoundRate(_roundDetails[0].toString());
      let tokenPrice = (parseFloat(100000) / parseFloat(_roundDetails[0])).toFixed(8)
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
    console.log("Entered init");
    try {
      if (!isConnected || !walletClient) return;
      
      // Get BNB balance
      const balance = await publicClient.getBalance({ address });
      setBNBBalance(balance);

      // Create ethers provider from wagmi
      const provider = new ethers.BrowserProvider(walletClient);
      const signer = await provider.getSigner();
      
      const contract = new Contract(presaleAddress, presaleAbi, signer);
      setPresaleContract(contract);
      
      const _tokenContract = new Contract(usdtAddress, usdtAbi, signer);
      setTokenContract(_tokenContract);
      
      const _saleTokenContract = new Contract(tokenAddress, tokenAbi, provider);
      setSaleTokenContract(_saleTokenContract);

      getInitialValues();
      fetchSaleTokenBalance(_saleTokenContract);

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

    if (curTime < startTime) {
      return presaleStates.IN_FUTURE;
    } else if (curTime >= startTime && curTime < endTime) {
      return presaleStates.RUNNING;
    } else {
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
      setUSDTBalance(balance);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchSaleTokenBalance = async (_saleTokenContract = null) => {
    try {
      if(!isConnected) return;
      const contractToUse = _saleTokenContract || saleTokenContract;
      if (!contractToUse) return;
      let balance = deciB(await contractToUse.balanceOf(address));
      setUserBalance({
        ...userBalance,
        tokenForSale: ethers.formatEther(balance.toString()),
      });
    } catch (error) {
      console.log(error);
    }
  };

  const maxToken = (isBnb) => {
    if (isBnb) {
      setAmountBnbPay(fromWei(bnbBalance));
    } else {
      setAmountUsdtPay(
        deci(usdtBalance)
          .div(10 ** 6)
          .toFixed(0)
      );
    }
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
      if (currentChain?.id !== bnbChainId) {
        Swal.fire(
          t("warning"),
          t("switch_chain_to_bsc"),
          "warning"
        );
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
      if (currentChain?.id !== bnbChainId) {
        Swal.fire(
          t("warning"),
          t("switch_chain_to_bsc"),
          "warning"
        );
        return;
      }
      
      if (!isConnected) {
        Swal.fire(t("warning"), t("connect_wallet_first"), "warning");
        return;
      }
      
      let purchasableAmount = deci(availableForPurchase).div(10 ** 18);
      console.log("purchasableAmount", purchasableAmount);
      let receivableAmount = deci(amountTokenReceivedBnb);
      console.log("receivableAmount", receivableAmount);
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
      console.log("value to send", weiValue.toFixed(0));
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
  };

  const updateProgressBar = () => {
    const currentTime = Math.floor(new Date().getTime() / 1000);
    let remainingTime = 0;
    let _saleState = getSaleState();
    if (_saleState === presaleStates.IN_FUTURE) {
      remainingTime = Math.floor(startDate.getTime() / 1000) - currentTime;
    } else if (_saleState === presaleStates.RUNNING) {
      remainingTime = Math.floor(endDate.getTime() / 1000) - currentTime;
    }
    setSaleState(_saleState);
    
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

  function startCountdown() {
    timerRef.current = setInterval(() => {
      updateProgressBar();
    }, 1000);
  }

  // THIS IS THE KEY FUNCTION - Direct wallet access with RainbowKit
  const watchAsset = async () => {
    if (!isConnected) {
      Swal.fire(t("connect_wallet_first"), "", "warning");
      return;
    }
    
    try {
      // RainbowKit gives us direct access to the wallet's provider
      // This works perfectly on mobile because it uses native wallet apps
      const provider = await walletClient.request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20",
          options: {
            address: tokenAddress,
            symbol: token.symbol,
            decimals: token.decimals,
            image: token.image,
          },
        },
      });
      
      if (provider) {
        Swal.fire(t("token_imported"), "", "success");
      } else {
        Swal.fire(t("token_already_in_wallet") || "Token already in wallet", "", "info");
      }
    } catch (error) {
      console.log("watchAsset error:", error);
      const errorMessage = error?.message?.toLowerCase() || "";
      
      if (errorMessage.includes("already") || errorMessage.includes("exist") || errorMessage.includes("added")) {
        Swal.fire(t("token_already_in_wallet") || "Token already in wallet", "", "info");
      } else if (errorMessage.includes("user rejected") || errorMessage.includes("user denied")) {
        // User cancelled - do nothing
        return;
      } else {
        // Show manual import as fallback
        Swal.fire({
          title: t("manual_import_required") || "Add Token Manually",
          html: `
            <div style="text-align: left; font-size: 14px;">
              <p style="margin-bottom: 10px;">Copy the token address and add it in your wallet:</p>
              <div style="margin: 10px 0;">
                <p style="margin: 5px 0; font-weight: bold;">Contract Address:</p>
                <p style="word-break: break-all; background: #f5f5f5; padding: 8px; border-radius: 4px; margin: 5px 0; font-family: monospace;">${tokenAddress}</p>
              </div>
              <p style="margin: 5px 0;"><strong>Symbol:</strong> ${token.symbol}</p>
              <p style="margin: 5px 0;"><strong>Decimals:</strong> ${token.decimals}</p>
            </div>
          `,
          icon: "info",
          confirmButtonText: "Copy Address",
          showCancelButton: true,
          cancelButtonText: "Close"
        }).then((result) => {
          if (result.isConfirmed) {
            copyToClipboard(tokenAddress);
            toast.success(t("copied"));
          }
        });
      }
    }
  };

  useEffect(() => {
    if (isConnected && walletClient && saleTokenContract) {
      fetchSaleTokenBalance();
    }
  }, [isConnected, walletClient, saleTokenContract]);

  useEffect(() => {
    startCountdown();
    return () => {
      clearInterval(timerRef.current);
    };
  }, [totalTime, startDate, endDate]);

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

  useEffect(() => {
    if (walletClient && isConnected) {
      init();
    }
  }, [walletClient, isConnected]);

  useEffect(() => {
    setSaleStateText(getSaleStateTextForTimer(saleState));
  }, [saleState,isConnected]);

  return (
    <main>
      <section className="flex items-center justify-center w-full ">
        <div className="w-full  max-w-[900px] mx-auto kakao-bg bg-cover bg-center bg-no-repeat">
          <div className="w-full relative 3xl:pt-24 lg:pt-18 pt-20 3xl:pb-16 pb-12 md:bg-contain ">
            <div className="w-full flex items-center flex-col">
              <h2 className="text-black2 3xl:mb-3 lg:mb-2 lg:text-base text-sm italic inline-flex mx-auto leading-5 lg:pt-1 lg:pb-1 font-bold rounded-full px-6 items-center justify-center bg-white text-center">
                <span>Round {curRoundIndex + 1}</span>
              </h2>

              <div className="w-full flex items-center lg:gap-2.5 gap-1.5 mx-auto justify-center max-w-[600px]">
                <div className="bg-black2 rounded-[10px] text-center 3xl:px-5 md:px-4 px-2">
                  <h4 className="lg:text-sm text-xs text-white">
                    {t("Days")}
                  </h4>
                  <h3 className="text-lg xl:leading-none lg:leading-8 leading-6 text-white font-bold">
                    {timerData.days}
                  </h3>
                </div>
                <span className=" text-lg  font-bold text-white leading-normal lg:-mt-3">
                  :
                </span>
                <div className="bg-black2 rounded-[10px] text-center 3xl:px-5 md:px-4 px-2">
                  <h4 className="lg:text-sm text-xs text-white">
                    {t("Hours")}
                  </h4>
                  <h3 className="text-lg xl:leading-none lg:leading-8 leading-6 text-white font-bold">
                    {timerData.hours}
                  </h3>
                </div>
                <span className="text-lg  font-bold text-white leading-normal lg:-mt-3">
                  :
                </span>
                <div className="bg-black2 rounded-[10px] text-center 3xl:px-5 md:px-4 px-2">
                  <h4 className="lg:text-sm text-xs text-white">
                    {t("Mins")}
                  </h4>
                  <h3 className="text-lg xl:leading-none lg:leading-8 leading-6 text-white font-bold text-center">
                    {timerData.minutes}
                  </h3>
                </div>
                <span className="text-2xl  font-bold text-white leading-normal lg:-mt-3">
                  :
                </span>
                <div className="bg-black2 rounded-[10px] text-center 3xl:px-5 md:px-4 px-2">
                  <h4 className="lg:text-sm text-xs text-white">
                    {t("Sec")}
                  </h4>
                  <h3 className="text-lg xl:leading-none lg:leading-8 leading-6 text-white font-bold text-center">
                    {timerData.seconds}
                  </h3>
                </div>
              </div>
              
              <p className="text-white 3xl:text-base md:text-sm text-xs text-center 3xl:py-3 py-1 md:py-2 m-0">
                1 {token.symbol} = <span>${tokenPrice}</span>
              </p>
              <ul className="p-0 m-0">
                <li className="flex items-center gap-20 justify-between mb-1 h-2">
                  <span className="text-[#68b8dc] font-medium text-[12px]">
                    {t("amount_raised")}
                  </span>
                  <span className="text-white text-[12px]">
                    $ {getFormattedAmount(totalTokensSold)}
                  </span>
                </li>
                <li className="flex items-center gap-20 justify-between mb-3">
                  <span className="text-[#68b8dc] font-medium text-[12px]">
                    {" "}
                    {t("your_holding")}
                  </span>
                    <span className="text-white text-[12px]">{userBalance.tokenForSale.toString()} {token.symbol}</span>
                </li>
              </ul>

              <div className="lg:w-full flex lg:max-w-[580px] justify-center items-center gap-3.5 mb-2">
                <button
                  type="button"
                  onClick={() => setBnbSelected(true)}
                  className="bg-black2 cursor-pointer transition-all duration-200 hover:bg-gray-800 hover:text-white flex items-center justify-center gap-3 rounded-full 3xl:text-lg lg:text-lg text-sm text-white 3xl:w-full px-6 md:px-8 max-w-[218px] py-1"
                >
                  <img src="/images/BSC-logo.png" className="w-4 lg:w-6" alt="" />
                  BNB
                </button>
                <button
                  type="button"
                  onClick={() => setBnbSelected(false)}
                  className="bg-black2 cursor-pointer transition-all duration-200 hover:bg-gray-800 hover:text-white flex items-center justify-center gap-3 rounded-full 3xl:text-lg lg:text-lg text-sm text-white 3xl:w-full px-6 md:px-8 max-w-[218px] py-1"
                >
                  <img src="/images/ustd-logo.png" className="w-4 lg:w-6" alt="" />
                  USDT
                </button>
              </div>

              <form className="w-full ml-4 3xl:max-w-[480px] md:translate-x-3 lg:max-w-[420px] md:max-w-[50%] sm:max-w-[80%] max-w-[300px]">
                <div className="w-full 3xl:mb-3 mb-2">
                  <div className="flex justify-between w-[95%]">
                  <label
                    htmlFor="amount"
                    className="3xl:text-base text-xs ml-2 text-white 3xl:mb-1 mb-0 block"
                  >
                    1 {token.symbol} = ${tokenPrice}
                  </label>
                  <p className="text-white 3xl:text-base md:text-sm text-xs text-center 3xl:py-3 py-1 md:py-2 m-0">
                    Buy Min $10
                  </p>
                  </div>
                  <div className="relative flex items-center justify-center">
                    <input
                      type="number"
                      id="input-pay"
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
                      name="payAmount"
                      className="w-[95%] md:text-sm pr-[158px] font-medium text-black1 bg-white px-3 py-1 outline-0 rounded-[5px]"
                    />
                    <button
                      type="button"
                      className="bg-black text-xs cursor-pointer transition-all duration-200 hover:bg-gray-800 hover:text-white text-white md:text-sm absolute rounded px-2 py-0.5 right-[50px]"
                      onClick={() => maxToken(bnbSelected)}
                    >
                      Max
                    </button>
                    <img
                      src={
                        bnbSelected ? "/images/bsc-logo-yellow.png" : "/images/ustd-logo.png"
                      }
                      className={clsx(
                        "absolute right-4 w-6",
                        !bnbSelected && "invert"
                      )}
                      alt=""
                    />
                  </div>
                </div>
                <div className="w-full">
                  <label
                    htmlFor="amount-receive"
                    className="text-xs ml-2 text-white mb-1 block"
                  >
                    Amount in {token.symbol} receive
                  </label>
                  <div className="relative flex items-center justify-center">
                    <input
                      type="text"
                      value={formatNumber(
                        bnbSelected
                          ? amountTokenReceivedBnb
                          : amountTokenReceivedUsdt
                      )}
                      readOnly={true}
                      id="input-receive"
                      placeholder=""
                      name="receiveAmount"
                      className="w-[95%] pr-12 md:text-md font-medium text-black1 bg-white px-3 py-1  outline-0 rounded-[5px]"
                    />
                    <img
                      src={token.image}
                      className="absolute right-4 w-7"
                      alt=""
                    />
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center">
                  <button
                      type="button"
                      id="buy-button"
                      onClick={
                        saleState === presaleStates.RUNNING ? buyTokens : null
                      }
                      className="bg-black text-sm h-9 rounded-xl mt-3 w-[95%] not-disabled:hover:bg-gray-800 not-disabled:cursor-pointer disabled:cursor-not-allowed shadow-xs shadow-gray-500"
                      style={{
                        color: "white",
                        fontWeight: "700",
                      }}
                      disabled={!isConnected}
                    >
                      <div
                        style={{
                          alignItems: "center",
                          justifyContent: "center",
                          display: "flex",
                        }}
                      >
                        <div
                          style={{
                            display: purchaseLoading ? "inline-block" : "none",
                          }}
                          id="loader"
                          className="w-full mt-4  text-base border-white bg-white"
                        />
                        {saleState === presaleStates.RUNNING
                          ? t("Buy Now")
                          : saleStateText}
                      </div>
                    </button>                    
                </div>
              </form>
              <div className="w-[95%] mt-2 mb-2 flex justify-center">
                      {/* <ConnectButton /> */}
                      {/* <ConnectButton/> */}
                      <AppKitButton balance="hide" />
              </div>
              <div className="w-full 3xl:max-w-[450px] md:translate-x-2 max-w-[400px] mt-1 lg:px-0 px-3">
                <div className="flex flex-col">
                <div className="flex items-center justify-between h-2">
                  <p className="text-white 3xl:text-lg text-xs ">
                    Contract Address:
                  </p>
                  <div className="flex items-center gap-2 ">
                    <p className="text-white 3xl:text-lg text-xs">
                      {tokenAddress.slice(0, 6)}...{tokenAddress.slice(-7)}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        copyToClipboard(tokenAddress);
                        toast.success(t("copied"));
                      }}
                      className="text-white cursor-pointer hover:text-gray-300 transition-colors bottom-2 relative"
                      title="Copy Contract Address"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-white 3xl:text-lg text-xs ">
                    Presale Address:
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-white 3xl:text-lg text-xs ">
                      {presaleAddress.slice(0, 6)}...{presaleAddress.slice(-7)}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        copyToClipboard(presaleAddress);
                        toast.success(t("copied"));
                      }}
                      className="text-white cursor-pointer  bottom-2 relative hover:text-gray-300 transition-colors"
                      title="Copy Presale Address"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
                </div>
                <div className="3xl:mt-3 3xl:px-6">
                  <p className="text-[10px] text-center text-white bg-black2 rounded-md py-2 px-3 ">
                    Never deposit money to the above two address ! Tokens and
                    only be purchaseed through a wallet connection. If it
                    dosen't work well on mobile, please try using PC.
                  </p>
                </div>
              </div>
            </div>
            <img
              src="/images/KakaoTalk_left.png"
              className="absolute md:block hidden  w-[150px] 3xl:left-0 left-10 3xl:w-[170px]"
              alt=""
            />
            <button
              type="button"
              onClick={watchAsset}
              className="bottom-10 3xl:w-[142px] w-[100px] absolute cursor-pointer 3xl:right-20 lg:right-40 right-28 md:left-auto md:translate-x-0 left-1/2 -translate-x-1/2 3xl:text-base text-xs font-bold md:py-1.5 py-1 3xl:h-[34px] bg-white rounded-lg text-black hover:bg-gray-200 transition-all duration-200"
            >
              + Add Token
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Swap;