import * as React from "react";
import {useEffect, useState} from "react";
import {ethers} from "ethers";
import './App.css';
import abi from "./utils/WavePortal.json";
import {createTheme} from '@mui/material/styles'
import {
    AppBar,
    Avatar,
    Box,
    Button,
    Chip,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Stack,
    TextField,
    ThemeProvider,
    Typography
} from "@mui/material";
import CelebrationIcon from '@mui/icons-material/Celebration';
import CircularProgress from '@mui/material/CircularProgress';
import InsertEmoticonIcon from "@mui/icons-material/InsertEmoticon";
import SentimentVeryDissatisfiedIcon
    from "@mui/icons-material/SentimentVeryDissatisfied";

export default function App() {
    const appTheme = createTheme({
        typography: {
            fontSize: 14,
            fontWeightLight: 300,
            fontWeightRegular: 400,
            fontWeightMedium: 700,
            fontFamily: "font-family:'Roboto' sans-serif;",

            h1: {fontSize: 60},
            h2: {fontSize: 48},
            h3: {fontSize: 42},
            h4: {
                fontSize: 36,
                textAlign: "center",
                paddingTop: 10,
                paddingBottom: 10
            },
            h5: {fontSize: 20},
            h6: {fontSize: 18},
            p: {fontSize: 16},
            subtitle1: {fontSize: 18},
            button: {
                textTransform: "none"
            }
        },
        palette: {
            light: "#64b5f6",
            main: "#2196f3",
            dark: "#1976d2",
        }
    })

    const [currentAccount, setCurrentAccount] = useState("");
    const [messageValue, setMessageValue] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [allWaves, setAllWaves] = useState([]);

    const contractAddress = "0x8095B68E8eFc07C7bF28b3C582fa645351bE063e";
    const contractABI = abi.abi;

    const getAllWaves = async () => {
        const {ethereum} = window;

        try {
            if (ethereum) {
                const provider = new ethers.providers.Web3Provider(ethereum);
                const signer = provider.getSigner();
                const wavePortalContract = new ethers.Contract(
                    contractAddress,
                    contractABI,
                    signer
                );
                /* コントラクトからgetAllWavesメソッドを呼び出す */
                const waves = await wavePortalContract.getAllWaves();
                /* UIに必要なのは、アドレス、タイムスタンプ、メッセージだけなので、以下のように設定 */
                const wavesCleaned = waves.map((wave) => {
                    return {
                        address: wave.waver,
                        timestamp: new Date(wave.timestamp * 1000),
                        message: wave.message,
                        seed: wave.seed,
                        balance: wave.balance
                    };
                });

                /* React Stateにデータを格納する */
                setAllWaves(wavesCleaned);
            } else {
                console.log("Ethereum object doesn't exist!");
            }
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        let wavePortalContract;

        const onNewWave = (from, timestamp, message, seed, limit) => {
            console.log("NewWave!!");
            setMessageValue("");
            setIsProcessing(false);

            allWaves.forEach((data) => {
                if (data.timestamp !== timestamp && data.address === from) {
                    setAllWaves((prevState) => [
                        ...prevState,
                        {
                            address: from,
                            timestamp: new Date(timestamp * 1000),
                            message: message,
                            seed: seed,
                            limit: limit
                        },
                    ]);
                }
            })


        };
        /* NewWaveイベントがコントラクトから発信されたときに、情報をを受け取ります */
        if (window.ethereum) {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();

            wavePortalContract = new ethers.Contract(
                contractAddress,
                contractABI,
                signer
            );
            console.log("on");
            wavePortalContract.on("NewWave", onNewWave);
        }
        /*メモリリークを防ぐために、NewWaveのイベントを解除*/
        return () => {
            if (wavePortalContract) {
                console.log("off");
                wavePortalContract.off("NewWave", onNewWave);
            }
        };
    }, []);

    const checkIfWalletIsConnected = async () => {
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
            const {ethereum} = window;
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

    /* waveの回数をカウントする関数を実装 */
    const wave = async () => {
        try {
            const {ethereum} = window;
            if (ethereum) {
                const provider = new ethers.providers.Web3Provider(ethereum);
                const signer = provider.getSigner();
                /* ABIを参照 */
                const wavePortalContract = new ethers.Contract(
                    contractAddress,
                    contractABI,
                    signer
                );
                let count = await wavePortalContract.getTotalWaves();
                console.log("Retrieved total wave count...", count.toNumber());
                /* コントラクトに👋（wave）を書き込む */

                const waveTxn = await wavePortalContract.wave(messageValue, {
                    gasLimit: 300000,
                });
                setIsProcessing(true);

                console.log("Mining...", waveTxn.hash);
                await waveTxn.wait();
                console.log("Mined -- ", waveTxn.hash);
                count = await wavePortalContract.getTotalWaves();
                console.log("Retrieved total wave count...", count.toNumber());
            } else {
                console.log("Ethereum object doesn't exist!");
            }
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        checkIfWalletIsConnected();
    }, []);

    return (
        <ThemeProvider theme={appTheme}>
            <div className="mainContainer">
                <Box>
                    <AppBar>
                        <Typography variant="h4">
                            Welcome to Waver!
                        </Typography>
                    </AppBar>
                </Box>

                <div className="dataContainer">
                    <div className="bio">
                        イーサリアムウォレットを接続(Goerli Network)して、メッセージを作成したら、
                        <span role="img" aria-label="hand-wave">
            👋
          </span>
                        を送ってください
                        <span role="img" aria-label="shine">
            ✨
          </span>
                        <br/>
                        運が良ければ 0.0001ETHが当たります！

                    </div>
                    <br/>
                    <div className="stack-container">
                        <Stack spacing={2} direction="column">
                            {!currentAccount && (
                                <Button variant="contained"
                                        onClick={connectWallet}>
                                    Connect Wallet
                                </Button>
                            )}
                            {/* ウォレットコネクトのボタンを実装 */}
                            {currentAccount && (
                                <Typography variant="p" color="dark">Wallet
                                    Connected<CelebrationIcon/></Typography>
                            )}

                            {/* waveボタンにwave関数を連動 */}
                            <Stack direction="column">
                                {isProcessing ? (
                                    <div style={{
                                        display: "flex",
                                        justifyContent: "center"
                                    }}>
                                        <CircularProgress/></div>) : (
                                    <>
                                        <TextField
                                            label="メッセージはこちら"
                                            variant="outlined"
                                            name="messageArea"
                                            type="text"
                                            id="message"
                                            value={messageValue}
                                            onChange={(e) => setMessageValue(e.target.value)}
                                        />
                                        {currentAccount && (
                                            <Button variant="contained"
                                                    onClick={wave}
                                                    color={"primary"}
                                                    disabled={messageValue === ""}
                                                    sx={{marginTop: '10px'}}
                                            >
                                                Wave at Me <span role="img"
                                                                 aria-label="hand-wave">
            👋
          </span>
                                            </Button>
                                        )}
                                    </>
                                )}
                            </Stack>
                        </Stack>
                    </div>
                    <br/>
                    <List sx={{
                        width: '100%',
                        maxWidth: 360,
                        bgcolor: 'background.paper'
                    }}>


                        {/* 履歴を表示する */}
                        {allWaves.length > 0 &&
                            allWaves
                                .slice(0)
                                .reverse()
                                .map((wave, index) => {
                                    return (
                                        <ListItem alignItems="flex-start"
                                                  key={index}>
                                            <ListItemAvatar>
                                                <Avatar
                                                    sx={{bgcolor: wave.seed >= 50 ? "dark" : "info"}}
                                                    src="/static/images/avatar/1.jpg"/>
                                            </ListItemAvatar>
                                            <Box component="span" sx={{
                                                p: 2,
                                                border: '1px dashed grey'
                                            }}>
                                                <ListItemText
                                                    primary={
                                                        <Typography
                                                            sx={{display: 'inline'}}
                                                            component="p"
                                                            variant="h5"
                                                            color="text.primary"
                                                        >
                                                            {wave.address}
                                                        </Typography>}
                                                    secondary={
                                                        <>
                                                            <Typography
                                                                sx={{display: 'inline'}}
                                                                component="span"
                                                                variant="body2"
                                                                color="text.secondary"
                                                            >
                                                                {`@ ${wave.timestamp}`}
                                                            </Typography>
                                                            <br/>
                                                            <Typography
                                                                sx={{display: 'inline'}}
                                                                component="span"
                                                                variant="body2"
                                                                color="text.secondary"
                                                            >
                                                            </Typography>

                                                        </>
                                                    }
                                                />
                                                {wave.seed >= 50 ? (
                                                    <Chip
                                                        sx={{
                                                            marginTop: '5px',
                                                        }}
                                                        size="small"
                                                        label="Won 0.0001 ETH"
                                                        color="info"
                                                        icon={
                                                            <InsertEmoticonIcon/>}
                                                    />
                                                ) : (
                                                    <Chip
                                                        sx={{marginTop: '5px'}}
                                                        size="small"
                                                        label="Lost..."
                                                        icon={
                                                            <SentimentVeryDissatisfiedIcon/>}
                                                    />)}
                                            </Box>
                                        </ListItem>
                                    );
                                })}
                    </List>
                </div>
            </div>
        </ThemeProvider>
    );

}
