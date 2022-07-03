import * as React from "react";
import { ethers } from "ethers";
import './App.css';
import {useEffect, useState} from "react";
import abi from "./utils/WavePortal.json";

export default function App() {
  const [currentAccount, setCurrentAccount] = useState("");
  /* ユーザーのメッセージを保存するために使用する状態変数を定義 */
  const [messageValue, setMessageValue] = useState("");
  const [allWaves, setAllWaves] = useState([]);


  const contractAddress = "0x1A04125fcE132B25198355FdD1D14F61aC075a8D";
  const contractABI = abi.abi;

  const getAllWaves = async () => {
    const { ethereum } = window;

    try {
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
            contractAddress,
            contractABI,
            signer
        )


        /* コントラクトからgetAllWavesメソッドを呼び出す */
        const waves = await wavePortalContract.getAllWaves();
        console.log("waves", waves);
        const waveCleaned = waves.map((wave) => {
          return {
            address: wave.address,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message
          };
        });
        setAllWaves(waveCleaned);

      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * `emit`されたイベントに反応する
   */
  useEffect(() => {
    let wavePortalContract;

    const onNewWave = (from, timestamp, message) => {
      console.log("NewWave", from, timestamp, message);
      setAllWaves((prevState) => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ]);
    };

    /* NewWaveイベントがコントラクトから発信されたときに、情報を受け取ります */
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
      );
      wavePortalContract.on("NewWave", onNewWave);
    }
    /*メモリリークを防ぐために、NewWaveのイベントを解除します*/
    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave);
      }
    };
  }, []);

  const checkIfWalletIsConnected = async() => {
    try {
      const {ethereum} = window;
      if (!ethereum) {
        console.log("Make sure you have Metamask!");
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      const accounts = await ethereum.request({method: "eth_accounts"});
      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account: ", account);
        setCurrentAccount(account);
        await getAllWaves();
      } else {
        console.log("No authorized account found");
      }
    } catch (error) {
      console.log(error);
    }
  };
  
  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      console.log("Connected: ", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  }

  const wave = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
            contractAddress,
            contractABI,
            signer
        );

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count);

        let contractBalance = await provider.getBalance(wavePortalContract.address);
        console.log("Contract balance:", ethers.utils.formatEther(contractBalance));

        const waveTxn = await wavePortalContract.wave(messageValue, { gasLimit: 300000 });

        console.log("Mining...", waveTxn.hash);
        await waveTxn.wait();

        console.log("Mined -- ", waveTxn.hash);
        count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());

        let contractBalance_post = await provider.getBalance(
            wavePortalContract.address
        );
        /* コントラクトの残高が減っていることを確認 */
        if (contractBalance_post < contractBalance) {
          /* 減っていたら下記を出力 */
          console.log("User won ETH!");
        } else {
          console.log("User didn't win ETH.");
        }
        console.log(
            "Contract balance after wave:",
            ethers.utils.formatEther(contractBalance_post)
        );

      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  return (
      <div className="mainContainer">
        <div className="dataContainer">
          <div className="header">
          <span role="img" aria-label="hand-wave">
            👋
          </span>{" "}
            WELCOME!
          </div>
          <div className="bio">
            イーサリアムウォレットを接続して、メッセージを作成したら、
            <span role="img" aria-label="hand-wave">
            👋
          </span>
            を送ってください
            <span role="img" aria-label="shine">
            ✨
          </span>
          </div>
          <br />
          {/* ウォレットコネクトのボタンを実装 */}
          {!currentAccount && (
              <button className="waveButton" onClick={connectWallet}>
                Connect Wallet
              </button>
          )}
          {currentAccount && (
              <button className="waveButton">Wallet Connected</button>
          )}
          {/* waveボタンにwave関数を連動 */}
          {currentAccount && (
              <button className="waveButton" onClick={wave}>
                Wave at Me
              </button>
          )}
          {/* メッセージボックスを実装*/}
          {currentAccount && (
              <textarea
                  name="messageArea"
                  placeholder="メッセージはこちら"
                  type="text"
                  id="message"
                  value={messageValue}
                  onChange={(e) => setMessageValue(e.target.value)}
              />
          )}
          {/* 履歴を表示する */}
          {currentAccount &&
              allWaves
                  .slice(0)
                  .reverse()
                  .map((wave, index) => {
                    return (
                        <div
                            key={index}
                            style={{
                              backgroundColor: "#F8F8FF",
                              marginTop: "16px",
                              padding: "8px",
                            }}
                        >
                          <div>Address: {wave.address}</div>
                          <div>Time: {wave.timestamp.toString()}</div>
                          <div>Message: {wave.message}</div>
                        </div>
                    );
                  })}
        </div>
      </div>
  );
}
