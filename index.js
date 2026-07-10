// function findTarget(nums, target) {
//     hash = new Map();
//     for(let i=0; i < nums.length; i++) {
//         let rem = target - nums[i];
//         if(hash.has(rem)) {
//             return [hash.get(rem), i];
//         }
//         hash.set(nums[i], i);
//     }

// }

// const result = findTarget([2, 7, 11, 15], 17);
// console.log(result);


// 2.Subdomain Visit Count


// ["9001 discuss.leetcode.com"]
// let cpdomains = ["9001 discuss.leetcode.com"];
// let hash = new Map();
// for(let i=0; i < cpdomains.length; i++) {
//     let [count, domain] = cpdomains[i].split(" ");
//     count = parseInt(count);
//     let subdomains = domain.split(".");
//     for(let j=0; j < subdomains.length; j++) {
//         let subdomain = subdomains.slice(j).join(".");
//         if(hash.has(subdomain)) {
//             hash.set(subdomain, hash.get(subdomain) + count);
//         } else {
//             hash.set(subdomain, count);
//         }
//     }
// }
// console.log(hash);


function isValidChain(words) {
    if (!words.length) return true;

    const sortedWords = [...words].sort(
        (a, b) => a.length - b.length
    );

    for (let i = 1; i < sortedWords.length; i++) {
        if (!sortedWords[i].startsWith(sortedWords[i - 1])) {
            return false;
        }
    }

    return true;
}

console.log(
    isValidChain(["ak", "aks","aksy", "aksh", "akshay"])
); // true