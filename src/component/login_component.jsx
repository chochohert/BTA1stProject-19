import React, { useState } from 'react'
import { useRecoilState } from 'recoil'
import { hot } from 'react-hot-loader'
import { recoilPageState } from '../states/recoilPageState'
import {
  Box,
  Button,
  ButtonGroup,
  Container,
  makeStyles,
  TextField,
} from '@material-ui/core'
import { Page } from '../enum/enum'
import { IsSecretKeyValid } from '../api/keyPair'
import * as crypto from 'crypto-js'
import { UnlockWallet } from '../api/account'
import ModalComponent from "./modal_component";

const LoginComponent = () => {
  const [page, setPage] = useRecoilState(recoilPageState)
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [open, setOpen] = useState(false)

  const goToPage = pageName => {
    setPage(pageName)
  }

  const handleClose = () => {
    setOpen(!open)
  }

  const handleChange = e => {
    setPassword(e.target.value)
  }

  const handleOnKeyDown = e => {
    if (e.keyCode === 13) {
      handleLogin()
    }
  }

  const handleLogin = () => {
    const encPassword = crypto.SHA256(password).toString(crypto.enc.Hex)
    chrome.storage.local.get('password', result => {
      const storagePassword = result.password
      if (!storagePassword) {
        setOpen(true)
        setErrorMessage('지갑 정보가 존재하지 않습니다. 계정 복구를 진행해주세요.')
        return
      }

      if (encPassword === storagePassword) {
        chrome.storage.local.get('secretKey', result => {
          const encSecretKey = result.secretKey
          const decSecretKey = crypto.AES.decrypt(encSecretKey, encPassword)
          const originalSecretKey = decSecretKey.toString(crypto.enc.Utf8)
          if (IsSecretKeyValid(originalSecretKey)) {
            UnlockWallet()
            setPage(Page.ACCOUNT)
          } else {
            setOpen(true)
            setErrorMessage('계정이 존재하지 않습니다.')
            return
          }
        })
      } else {
        setOpen(true)
        setErrorMessage('패스워드가 일치하지 않습니다')
        return
      }
    })
  }

  const classes = makeStyles(() => ({
    container: {
      textAlign: 'center',
      marginTop: '100px',
    },
    logoImage: {
      width: '100px',
      height: '96px',
    },
    inputContainer: {
      padding: '30px 0 10px',
    },
    buttonContainer: {
      width: '176px',
      margin: '0 auto',
    },
    divider: {
      margin: '20px 0 0',
    },
    textButton: {
      fontSize: '0.5rem',
    },
    buttonGroup: {
      marginTop: '5px',
      textAlign: 'center',
    },
  }))()

  return (
    <div>
      <ModalComponent
        open={open}
        handleClose={handleClose}
        message={errorMessage}
        title={'로그인 실패'}
      />
      <Container className={classes.container}>
        <img
          className={classes.logoImage}
          src="https://velas.com/assets/img/logo-footer.svg"
        />
        <Box className={classes.inputContainer}>
          <TextField
            type="password"
            label="password"
            placeholder="password"
            onChange={handleChange}
            onKeyDown={handleOnKeyDown}
          />
        </Box>
        <Box className={classes.buttonContainer}>
          <Button
            variant="contained"
            color="primary"
            fullWidth={true}
            onClick={handleLogin}
          >
            로그인
          </Button>
          <ButtonGroup
            variant="text"
            aria-label="text primary button group"
            className={classes.buttonGroup}
          >
            <Button
              onClick={() => {
                goToPage(Page.NEW_ACCOUNT)
              }}
              className={classes.textButton}
            >
              new
            </Button>
            <Button
              onClick={() => {
                goToPage(Page.RECOVER_ACCOUNT)
              }}
              className={classes.textButton}
            >
              restore
            </Button>
          </ButtonGroup>
        </Box>
      </Container>
    </div>
  )
}

export default hot(module)(LoginComponent)
