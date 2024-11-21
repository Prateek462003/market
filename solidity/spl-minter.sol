// // Import necessary libraries for SPL token and metadata handling.
// import "../libraries/spl_token.sol";
// import "../libraries/mpl_metadata.sol";

// // Define the program contract with the specified program ID on the Solana blockchain.
// @program_id("543xjVFqEUnvU7HkgRUxWSi7VNvRmtQ3xfaZN9557Xhb")
// contract spl_token_minter {

//     @payer(payer) // payer for the "data account"
//     constructor() {}

//     // Function to create a new token mint and associated metadata.
//     @mutableSigner(payer) // payer account
//     @mutableSigner(mint) // mint account to be created
//     @mutableAccount(metadata) // metadata account to be created
//     @signer(mintAuthority) // mint authority for the mint account
//     @account(rentAddress)
//     @account(metadataProgramId)
//     function createTokenMint(
//         address freezeAuthority, // freeze authority for the mint account
//         uint8 decimals, // decimals for the mint account
//         string name, // name for the metadata account
//         string symbol, // symbol for the metadata account
//         string uri // uri for the metadata account
//     ) external {
//         // Invoke System Program to create a new account for the mint account and,
//         // Invoke Token Program to initialize the mint account
//         // Set mint authority, freeze authority, and decimals for the mint account
//         SplToken.create_mint(
//             tx.accounts.payer.key,            // payer account
//             tx.accounts.mint.key,            // mint account
//             tx.accounts.mintAuthority.key,   // mint authority
//             freezeAuthority, // freeze authority
//             decimals         // decimals
//         );

//         // Invoke Metadata Program to create a new account for the metadata account
//         MplMetadata.create_metadata_account(
//             tx.accounts.metadata.key, // metadata account
//             tx.accounts.mint.key,  // mint account
//             tx.accounts.mintAuthority.key, // mint authority
//             tx.accounts.payer.key, // payer
//             tx.accounts.payer.key, // update authority (of the metadata account)
//             name, // name
//             symbol, // symbol
//             uri, // uri (off-chain metadata json)
//             tx.accounts.rentAddress.key,
//             tx.accounts.metadataProgramId.key
//         );
//     }

//     // Function to mint tokens to a specified token account.
//     @mutableAccount(mint)
//     @mutableAccount(tokenAccount)
//     @mutableSigner(mintAuthority)
//     function mintTo(uint64 amount) external {
//         // Mint tokens to the token account
//         SplToken.mint_to(
//             tx.accounts.mint.key, // mint account
//             tx.accounts.tokenAccount.key, // token account
//             tx.accounts.mintAuthority.key, // mint authority
//             amount // amount
//         );
//     }

//     // Transfer tokens from one token account to another via Cross-Program Invocation to Token Program
//     function transferTokens(
//     address from, // token account to transfer from
//     address to, // token account to transfer to
//     uint64 amount // amount of tokens to transfer
//     ) public {
//         SplToken.TokenAccountData from_data = SplToken.get_token_account_data(from);
//         SplToken.transfer(from, to, from_data.owner, amount);
//     }

// }

import "../libraries/spl_token.sol";
import "../libraries/mpl_metadata.sol";

@program_id("CieVokNRiDCXRPF6yMNFwzJf3kNebefw3GwbxmS6sGTL")
contract spl_token_minter {
    @payer(payer)
    constructor() {}


    @mutableSigner(payer) // payer account
    @mutableSigner(mint) // mint account to be created
    @mutableAccount(metadata) // metadata account to be created
    @signer(mintAuthority) // mint authority for the mint account
    @account(rentAddress)
    @account(metadataProgramId)
    function createTokenMint(
        address freezeAuthority, // freeze authority for the mint account
        uint8 decimals, // decimals for the mint account
        string name, // name for the metadata account
        string symbol, // symbol for the metadata account
        string uri // uri for the metadata account
    ) external {
        // Invoke System Program to create a new account for the mint account and,
        // Invoke Token Program to initialize the mint account
        // Set mint authority, freeze authority, and decimals for the mint account
        SplToken.create_mint(
            tx.accounts.payer.key,            // payer account
            tx.accounts.mint.key,            // mint account
            tx.accounts.mintAuthority.key,   // mint authority
            freezeAuthority, // freeze authority
            decimals         // decimals
        );

        // Invoke Metadata Program to create a new account for the metadata account
       // Invoke Metadata Program to create a new account for the metadata account
        MplMetadata.create_metadata_account(
            tx.accounts.metadata.key, // metadata account
            tx.accounts.mint.key,  // mint account
            tx.accounts.mintAuthority.key, // mint authority
            tx.accounts.payer.key, // payer
            tx.accounts.payer.key, // update authority (of the metadata account)
            name, // name
            symbol, // symbol
            uri, // uri (off-chain metadata json)
            tx.accounts.rentAddress.key,
            tx.accounts.metadataProgramId.key
        );

        // Invoke Metadata Program to create a new account for the metadata account
        // MplMetadata.create_metadata_account(
        //     tx.accounts.metadata.key, // metadata account
        //     tx.accounts.mint.key,  // mint account
        //     mintAuthority, // mint authority
        //     payer, // payer
        //     payer, // update authority (of the metadata account)
        //     name, // name
        //     symbol, // symbol
        //     uri // uri (off-chain metadata json)
        // );
    }

    // // create ata 
    // @mutableSigner(payer) // payer account
    // @mutableAccount(tokenAccount)
    // @mutableAccount(mint) // mint account to be created
    // @mutableSigner(owner) // owner
    // function createAssociatedTokenAccount() external {
    //     SplToken.create_associated_token_account(
    //         tx.accounts.payer.key,
    //         tx.accounts.tokenAccount.key,
    //         tx.accounts.mint.key,
    //         tx.accounts.owner.key
    //     );
    // }

    @mutableAccount(mint)
    @mutableAccount(tokenAccount)
    @mutableSigner(mintAuthority)
    function mintTo(uint64 amount) external {
        // Mint tokens to the token account
        SplToken.mint_to(
            tx.accounts.mint.key, // mint account
            tx.accounts.tokenAccount.key, // token account
            tx.accounts.mintAuthority.key, // mint authority
            amount // amount
        );
    }



     // Transfer tokens from one token account to another via Cross Program Invocation to Token Program
    // function transferTokens(
    //     address from, // token account to transfer from
    //     address to, // token account to transfer to
    //     uint64 amount // amount to transfer
    // ) public {
    //     SplToken.TokenAccountData from_data = SplToken.get_token_account_data(from);
    //     SplToken.transfer(from, to, from_data.owner, amount);
    // }

    // Transfer tokens from one token account to another via Cross Program Invocation to Token Program
    @mutableAccount(from) // token account to transfer from
    @mutableAccount(to) // token account to transfer to
    @mutableSigner(owner)
    function transferTokens(
        uint64 amount // amount to transfer
    ) external {
        SplToken.transfer(
            tx.accounts.from.key, 
            tx.accounts.to.key, 
            tx.accounts.owner.key, 
            amount
        );
    }


}