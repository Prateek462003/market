    import "solana";
    import "./spl_token_minter.sol";
    // import "./spl-minter.sol";

    // SPL Token Minter Program Interface
    // Interface for the spl_token_minter program
    // interface splTokenMinterInterface {
    //     function transferTokens(address from, address to, uint64 amount) external;
    // }


    @program_id("aikiSUtSCAnjnQe5TVyhKX33bMABjzFDzixPVP6B6AA")
    contract prediction_market {
        struct Option {
            string name;
            uint256 price;
            uint256 pool;
        }

        Option[] public options;
        uint256 public totalPool;
        uint256 public constant PRECISION = 1e18;

        string public description;
        mapping(address => mapping(uint256 => uint256)) public userShares;
        uint256 public winningOptionIndex;
        bool public winnerDeclared = false;

        address public admin;
        address public contractTokenAccount;
        
        bool private initialized;
        event SharesBought(address indexed user, uint256 indexed optionIndex, uint256 sharesBought, uint256 amountSpent);
        // event SharesSold(address indexed user, uint256 indexed optionIndex, uint256 sharesSold, uint256 amountReceived);
        

        @space(2000)
        @payer(payer)
        constructor( 
            string memory _description,
            string[] memory optionNames,
            uint256[] memory initialPool,
            address _admin,
            address _contractTokenAccount,
            address payer) {

            require(!initialized, "Contract is already initialized");
            initialized = true;
            
            contractTokenAccount = _contractTokenAccount;
            admin = _admin;
            description = _description;
            

            for (uint256 i = 0; i < initialPool.length; i++) {
                totalPool += initialPool[i];
            }

            for (uint256 i = 0; i < initialPool.length; i++) {
                options.push(Option({
                    name: optionNames[i],
                    price: initialPool[i]*PRECISION /totalPool,
                    pool: initialPool[i]
                }));
            }
        }

        function updatePrices() internal {
            for (uint256 i = 0; i < options.length; i++) {
                if (totalPool > 0) {
                    options[i].price = (options[i].pool * PRECISION) / totalPool;
                }
            }
        }

        function getUserShares(address caller, uint256 optionIndex) external view returns ( uint256 ) {
            return userShares[caller][optionIndex];
        }


        function getEffectivePrice(uint256 optionIndex, uint256 betAmount) public view returns (uint256) {
            uint256 currentPrice = options[optionIndex].price;
            uint256 newPrice = (options[optionIndex].pool + betAmount) * PRECISION / (totalPool + betAmount);
            uint256 effectivePrice = (currentPrice + newPrice) / 2;
            return effectivePrice;
        }

        function getDetails() external view returns (Option[] memory) {
            return options;
        }

        
        function buy(uint256 optionIndex, uint256 betAmount, address caller, address signer) external {
            require(optionIndex < options.length, "Invalid option");
            require(!winnerDeclared, "Winner already declared");
            require(totalPool > 0, "Liquidity must be added before placing bets");
            
            // Transfer tokens from the caller to the contract
            transferTokensFromUserToContract(caller, betAmount, signer);
            
            options[optionIndex].pool += betAmount;
            totalPool += betAmount;

            updatePrices();

            uint256 effectivePrice = getEffectivePrice(optionIndex, betAmount);

            uint256 sharesBought = (betAmount * PRECISION) / effectivePrice;

            userShares[caller][optionIndex] += sharesBought;

            // Emit the SharesBought event
            emit SharesBought(caller, optionIndex, sharesBought, betAmount);
        }

        // Function to transfer tokens from the user to the contract via a CPI call
        function transferTokensFromUserToContract(address user, uint256 amount, address signerAccount) internal {
            uint64 amount64 = uint64(amount);
            AccountMeta[3] metas = [
                AccountMeta({pubkey: user, is_writable: false, is_signer: false}), // User's token account
                AccountMeta({pubkey: contractTokenAccount, is_writable: false, is_signer: false}), // Contract's token account
                AccountMeta({pubkey: signerAccount, is_writable: true, is_signer: true}) // SplTokenMinter program
            ];

            spl_token_minter.transferTokens{accounts: metas}( amount64 );
        }

        function sell(uint256 optionIndex, uint256 shareAmount, address caller) external {
            require(optionIndex < options.length, "Invalid option");
            require(!winnerDeclared, "Winner already declared");
            require(userShares[caller][optionIndex] >= shareAmount, "Insufficient shares");

            uint256 currentPrice = options[optionIndex].price;
            uint256 poolReduction = (shareAmount * currentPrice) / PRECISION;

            uint256 newOptionPool = options[optionIndex].pool > poolReduction 
                ? options[optionIndex].pool - poolReduction 
                : 1;
            uint256 newTotalPool = totalPool > poolReduction 
                ? totalPool - poolReduction 
                : 1;

            uint256 newPrice = (newOptionPool * PRECISION) / newTotalPool;

            uint256 effectivePrice = (currentPrice + newPrice) / 2;

            uint256 sellValue = (shareAmount * effectivePrice) / PRECISION;

            options[optionIndex].pool = newOptionPool;
            totalPool = newTotalPool;

            updatePrices();

            userShares[caller][optionIndex] -= shareAmount;

            // Emit the SharesSold event
            // emit SharesSold(msg.sender, optionIndex, shareAmount, sellValue);
        }

    }
