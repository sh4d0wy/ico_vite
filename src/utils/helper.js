let helperFunctions = {
    getStringUntilPeriod: (inputString) => {
        var index = inputString.indexOf(".");
        if (index !== -1) {
            return inputString.substring(0, index);
        }
        return inputString;
    }
}
export default helperFunctions;
