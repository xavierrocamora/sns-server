module.exports = {
    development: {
        port: process.env.PORT || 3000,
        saltingRounds: 10,
        itemsPerPage: 4,
        userImagesFolder: './uploads/users/',
        publicationImagesFolder: './uploads/publications/'
    },
    production: {
        port: process.env.PORT || 3000,
        saltingRounds: 10,
        itemsPerPage: 4,
        userImagesFolder: './uploads/users/',
        publicationImagesFolder: './uploads/publications/'
    }
}