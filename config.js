module.exports = {
    development: {
        port: process.env.PORT || 3000,
        saltingRounds: 10,
        itemsPerPage: 2,
        userImagesFolder: './uploads/users/',
        publicationImagesFolder: './uploads/publications'
    }
}