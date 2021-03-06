const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator/check');

const Profile = require('../../models/Profile');
const User = require('../../models/User');

router.get('/me', auth, async(req, res) => {
    try{
        const profile = await Profile.findOne({ user: req.user.id}).populate('user', ['name', 'avatar']);

        if(!profile) {
            return res.status(400).json({ msg: 'There is no such profile'});
        }
        res.json(profile);
    } catch(err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.post('/', [auth, [
    check('status', 'Status is required').not().isEmpty(),
    check('skills', "Skiils are required").not().isEmpty()
] ],
 async (req, res) => {
     const errors = validationResult(req);
     if(!errors.isEmpty()) {
         return res.status(400).json({ errors: errors.array() });
     }

     const {
         company,
         website,
         location,
         bio,
         status,
         githubusername,
         skills,
         youtube,
         facebook,
         twitter,
         instagram,
         linkedin
     } = req.body;

     const profileFields = {};
     profileFields.user = req.user.id;
     if(company) profileFields.comapny = company;
     if(website) profileFields.website = website;
     if(location) profileFields.location = location;
     if(bio) profileFields.bio = bio;
     if(status) profileFields.status = status;
     if(githubusername) profileFields.githubusername = githubusername;
     if(skills) {
         profileFields.skills = skills.split(',').map(skill => skill.trim());
     }
     profileFields.social = {};
     if(youtube) profileFields.social.youtube = youtube;
     if(twitter) profileFields.social.twitter = twitter;
     if(facebook) profileFields.social.facebook = facebook;
     if(linkedin) profileFields.social.linkedin = linkedin;
     if(instagram) profileFields.social.instagram = instagram;

     try{
         let profile = await Profile.findOne({ user: req.user.id});
         if(profile) {
             profile = await Profile.findOneAndUpdate(
                 { user: req.user.id },
                 { $set: profileFields },
                 { new: true }
             );
             return res.json(profile);
         }
         profile = new Profile(profileFields);
         await profile.save();
         res.json(profile);
     } catch(err) {
         console.error(err.message);
         res.status(500).send('Server Error');
     }
 }
);

router.get('/', async(req, res) => {
    try {
        const profiles = await Profile.find().populate('User', ['name', 'avatar']);
        res.json(profiles);
    } catch(err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.get('/user/:user_id', async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.params.user_id}).populate('user', ['name', 'avatar']);
        if(!profile) return res.status(400).json({ msg: 'Profile not found'});
        res.json(profile);
    } catch(err) {
        console.error(err.message);
        if(err.kind == 'ObjectId') {
            return res.status(400).json({ msg: 'Profile Not found'});
        }
        res.status(500).send('Server Error');
    }
});

router.delete('/', auth, async(req, res) => {
    try{
        await Profile.findOneAndRemove({ user: req.user.id });

        await User.findOneAndRemove({ _id: req.user.id });

        res.json({ msg: 'User Deleted!'});
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;